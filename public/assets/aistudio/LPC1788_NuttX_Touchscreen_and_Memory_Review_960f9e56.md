# LPC1788 NuttX: Touchscreen and Memory Review

Review of the EA LPC1788 OEM Board (rev E) NuttX port: touchscreen behavior, lower-half design, and memory layout for SD, ELF and Ethernet. The LCD work checks out against the schematic: the `VD19..23` blue mapping and the PCA9532 bytes `LS1 = 0x40`, `LS2 = 0x01` are consistent, since `DISP_EN` on LED4 stays hi-Z. The NuttX tree was not available for review, so the driver points below are hypotheses to confirm.

## 1. Why PENIRQ reads high while you press

The most likely cause is the XPT2046/ADS7843 power-down bits, not the GPIO setup. PENIRQ is only active when the last command left PD1:PD0 at `00` or `10`. A command with PD0=1 (`01` or `11`) disables the pin, and it then reads high regardless of touch. Check the PD bits in your `ads7843e.h` command constants against the datasheet. Two things can leave the pin disabled when the worker samples it:

- **Edge vs. level:** the falling edge is real. The worker then calls `pendown()` after a debounce, and that read may land after a conversion command or during contact bounce.
- **Order of reads:** the driver should send the "enable PENIRQ" command and let it settle before anything reads the level. The `ISISIS...` trace is consistent with re-arming without ever getting a valid level.

### Quick test

With the driver idle and no worker activity, poll the pin while pressing:

1. Read `FIO2PIN` bit 15 from NSH with `mb`/`mh`. The address is believed to be `0x20098054` on the LPC178x; verify it in UM10470.
2. If it reads 0 while touched, the hardware and pin config are fine, and the problem is where in the sample sequence the level is read.
3. If it never goes low, look at the IOCON mode for P2.15 and the filter on the LCD board's IRQ line.

EA's bare-metal code avoids all of this by reading Z1/Z2 pressure over SPI. Linux's `ads7846` does the same: it uses PENIRQ only as a wakeup and decides pen-down from pressure.

## 2. Cleanest lower-half design

Use the IRQ only as a wakeup and decide pen-down from pressure in the driver. A level-only `pendown()` cannot work if the pin is disabled during conversions.

- **Driver change (preferred):** in `ads7843e_worker`, after reading X and Y, also read Z1 (and Z2 if a ratio is wanted). Treat the pen as down while pressure is above a threshold, and up once it drops. This removes the need to hold your finger down.
- **No-driver-change fallback:** have `pendown()` return true when the pin is low or a "fresh edge" flag is set, and consume the flag on the first read. That gives one sample per tap, so it will not track a held touch.
- **Phantom sample:** `g_tsc_irq_fired` is set in `tsc_clear()`, but the driver also calls `clear` outside real touches (register/open). Set the flag only from a real GPIO interrupt instead. Attach a small board ISR in `attach()` that sets the flag and then calls the driver's handler.
- **On open:** clear the flag and write `GPIOINT2_INTCLR` in `tsc_enable(true)` before `up_enable_irq()`, which is already done.

## 3. SD, ELF and Ethernet next to the framebuffer

These points are not all verified against your tree, so treat them as checks.

- **Heap vs. framebuffer:** the freeze is the SDRAM heap starting at `0xA0000000` and swallowing `/dev/fb0` at `0xA0010000`. The usual fix is to move the VRAM base to the top of SDRAM and shrink the heap with `CONFIG_LPC17_40_EXTDRAMSIZE`. For example, set the heap size to `0x01F00000` and put VRAM at `0xA1F00000`, which leaves room for two 255 KB buffers. Grep the tree for the exact Kconfig and VRAM define names.
- **Executing code from SDRAM (important for `CONFIG_ELF`):** the ARMv7-M default memory map is believed to mark `0xA0000000–0xDFFFFFFF` as execute-never. If so, ELF modules loaded into an SDRAM heap would hard-fault when run. This needs an MPU region that allows execution there, or module loads must stay in internal SRAM. Check this before investing in ELF.
- **Ethernet:** the LPC17xx EMAC driver places descriptors and buffers in AHB SRAM bank 0 (verify in `lpc17_40_ethernet.c`). That is another reason to keep `CONFIG_MM_REGIONS=1` and leave AHB SRAM out of the heap.
- **SD/MMC (`J13`):** the pins are `MCICLK` P1.2, `MCICMD` P1.3, `MCIPWR` P1.5 and `MCIDAT0..3` P1.6, P1.7, P1.11, P1.12. These do not overlap RMII or the LCD pins. The schematic suggests card-detect is on P5.0, but this is unconfirmed. Enable `CONFIG_LPC17_40_SDCARD` and FAT on top, and add it after touch and NxWM are stable.

## Next step

Report what the `FIO2PIN` bit-15 poll shows. That narrows the touch cause to one of the two branches above.
