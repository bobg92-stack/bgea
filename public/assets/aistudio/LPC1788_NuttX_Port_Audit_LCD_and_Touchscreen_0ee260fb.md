# LPC1788 NuttX Port Audit: LCD and Touchscreen

Audit of the EA LPC1788 OEM Board (rev E) on the OEM Base Board (rev C), checked against the two attached schematic PDFs. The source diffs and NuttX tree were not available for review, so the driver-level points are hypotheses to confirm with the debugger, not verified diagnoses.

## 1. Hardware facts that need correcting or checking

### Blue channel mapping is off by one (a real error)

Page 14 of the base board schematic shows the 5:6:5 blue lines as `BLCD_VD19..VD23`, not VD18..22. They come from these pins:

- `GPIO13_LCDVD19` is P2.13
- `GPIO50_LCDVD20` is P1.26
- `GPIO51_LCDVD21` is P1.27
- `GPIO52_LCDVD22` is P1.28
- `GPIO53_LCDVD23` is P1.29

`VD18` (P2.12) is marked "normally not connected". Red (VD3..7 = P4.29, P2.6..9) and green (VD10..15 = P1.20..25) match your list. If your `board.h` maps blue to VD18..22, or leaves out P1.29, that is a bug.

### Pin alternates matter

The OEM schematic shows most of these pins have two LCD alternates, for example:

- P1.20 is `LCD_VD6/LCD_VD10`
- P1.26 is `LCD_VD12/LCD_VD20`
- P2.12 is `VD4/3/8/18`
- P4.29 is `VD7/11/3`

You need the alternate that carries the 5:6:5 signal number, not just any LCD function. The open1788 `board.h` pin definitions were written for a different panel and may select the wrong ones.

### PCA9532 address and net names

The `0x64` address and the `3V3_EN`, `5V_EN`, `DISP_EN` and `BL_C` names cannot be confirmed from these PDFs. Page 7 shows the base board's own PCA9532 (U8) at 8-bit `0xC0` (7-bit `0x60`), driving the on-board LEDs. Your `0x64` ACK works, so the device is almost certainly on the LCD expansion board, whose schematic was not provided. The EA sample code is therefore the only source for those net names. Treat them as unverified.

### Check your PCA9532 bytes

In the PCA9532, each LED gets 2 bits: `00` is input (hi-Z), `01` is output low, `10` is PWM0, `11` is PWM1.

- `LS0 = 0x05` sets LED0 and LED1 low, which fits `3V3_EN` and `5V_EN`.
- `LS1 = 0x40` sets only LED7 (bits 7:6). It does nothing to LED4.
- `LS2 = 0x00` leaves LED8 as hi-Z.

So `DISP_EN` on LED4 is not being driven by the write as described. Either the net mapping differs from what you wrote, or `DISP_EN` is floating. Read back LS0..LS3 from the chip and compare them with what `ea_lcd_board.c` writes.

### Confirmed against the PDFs

- **JP34:** `1-2` is correct for the LPC1788.
- **SDRAM:** 32 MB at DYCS0 is correct.
- **Console UART:** UART0 on P0.2/P0.3 is correct.
- **SSP0 pins:** P0.15, P0.17 and P0.18 are correct.

## 2. LCD stays solid white

Solid white on a normally-white TN panel usually means it is not getting valid DCLK, enable or data. It does not mean "wrong pixel data". In rough order of likelihood:

1. **Fix the blue mapping and alternates** above.
2. **Check the panel timings and polarities.** The open1788 config is tuned for a different 4.3" panel. Copy from `ea_lcd_board.c`:
   - HSW, HBP, HFP, VSW, VBP, VFP
   - pixel clock rate
   - the polarity bits in `LCD_POL`: IPC, IHS, IVS and IOE for `LCD_ENAB`
   - whether the panel runs in DE mode or sync mode

   A wrong `LCD_ENAB` polarity alone gives a blank or white screen.
3. **Dump the LCD controller registers when it is white.** Check these against UM10470 for your part:
   - **`PCONP`:** bit PCLCD set.
   - **`LCD_CFG` (SYSCON):** the divider gives a sane pixel clock, around 9 MHz for this panel.
   - **`LCD_CTRL`:** LcdEn=1, LcdPwr=1, LcdTFT=1, and the BPP field set to 16bpp 5:6:5. Check the BGR bit if colors are swapped.
   - **`LCD_UPBASE`:** equals `0xA0010000`.
4. **Separate the controller from the content.** Fill the framebuffer with a solid color (`mw` from NSH works) and see whether the screen changes. If it stays white, the problem is the signals or the panel enable. If it changes, the fb example's content is the problem.
5. **Check sequencing.** Some panels want `DISP_EN` asserted only after DCLK is running. Your init currently powers the backlight right after `fb_register`. Compare the order against the EA sample.

## 3. Touchscreen freeze on touch

The clue is that adding a `printf` (a delay of many ms) cures the freeze, while a 2 µs delay is a guess. That points to an **interrupt storm or worker loop**, not a chip-select setup-time problem. The XPT2046's CS-to-clock setup time is tiny, and the SSP driver already provides far more than 2 µs between select and the first clock.

### Likely mechanism

- The pen IRQ line (P2.15) can toggle during conversions.
- It is a falling-edge GPIO interrupt on the shared GPIO interrupt vector.
- If an edge latches while the IRQ is disabled, it fires again as soon as the driver re-enables it, so the worker re-arms endlessly.

### What to do, in order

1. **Halt with SES/JTAG during the freeze** and read the PC and backtrace. That settles whether it is an IRQ loop or a fault in seconds.
2. **Clear the latched P2.15 status immediately before every re-enable** (the `GPIOINT2_INTCLR` write), not only the first time. The right place is the lower-half `enable()`/`clear()` callbacks.
3. **Check the worker priority.** `CONFIG_SCHED_HPWORKPRIORITY=90` is below the default 224 and below NSH's 100. Unless you have a reason, go back to the default.
4. **Drop the `up_udelay(2)`** unless the debugger shows a real SPI timing problem.

### Watchdog delay

Upstream likely already uses a delay in this range, but check the file in your tree. Lengthening `ADS7843E_WDOG_DELAY` only slows the retry loop and will not cure a storm.

### Next step

If you can report where the debugger stops during the freeze, the diagnosis can be narrowed much further.
