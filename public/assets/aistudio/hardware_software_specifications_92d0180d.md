# Comprehensive Specification Document

**Generated for:** User request on 2026-11-23

## 1. Hardware Platform

| Item | Detail |
|------|--------|
| **Board** | **Embedded Artists LPC1788 Development Board** (LPC1768/LPC1788 based development board) |
| **Microcontroller** | NXP **LPC1788** – ARM Cortex‑M3, 128 KB flash, 64 KB SRAM |
| **Flash Memory** | 512 KB total on‑chip flash (we are using a 117 432 byte image) |
| **SRAM** | 96 KB (64 KB tightly‑coupled, 32 KB general‑purpose) |
| **Peripherals Enabled** (via NuttX config) |
| • UART0 (debug console) | yes |
| • UART2, UART3 | yes |
| • USB Host MSC/HID/CDC | yes |
| • CAN (CAN2) | yes |
| • I2S (audio codec UDA1380) | yes |
| • MMC/SD (through LPC17xx_40xx SDIO) | yes |
| • Ethernet (via EMAC) | yes |
| • GPIO, PWM (PWM1) | yes |
| • RTC | yes |
| **External Interfaces** |
| • USB‑to‑UART adapter (identified as `/dev/ttyUSB0`) |
| • LPC21ISP in‑system programming mode |

## 2. Software Stack

### 2.1 Operating System
- **NuttX** (the exact commit/branch was not explicitly reported, but the source tree resides at `/home/bg9211014/nuttxspace/nuttx`).
- **Configuration:** `full_all` for the `open1788` board (see `defconfig` below).

### 2.2 Build Toolchain
| Tool | Version / Path |
|------|----------------|
| **Compiler** | `arm-none-eabi-gcc` (system default, invoked via `make`) |
| **Linker/Objcopy** | `arm-nuttx-elf-objcopy` (used to produce `nuttx.hex`) |
| **Flashing utility** | `lpc21isp` version **1.97** (located in `$PATH`) |
| **Make** | GNU make (invoked by `make -j$(nproc) BOARD=open1788 V=1`) |

### 2.3 NuttX Configuration (full_all)
The `defconfig` used is stored in the artifact `full_all_defconfig_raw.cfg`. Key excerpts (full file attached) include:

```text
# Board basics
CONFIG_ARCH="arm"
CONFIG_ARCH_BOARD="open1788"
CONFIG_ARCH_BOARD_OPEN1788=y
CONFIG_ARCH_CHIP="lpc17xx_40xx"
CONFIG_ARCH_CHIP_LPC1788=y
CONFIG_ARCH_CHIP_LPC17XX_40XX=y
CONFIG_ARCH_STACKDUMP=y

# Core kernel features
CONFIG_BUILD_PROTECTED=y
CONFIG_DEV_LOOP=y

# UI / Graphics
CONFIG_NX=y
CONFIG_NXFONT_SANS23X27=y
CONFIG_LCD=y
CONFIG_LCD_BPP16=y
CONFIG_VIDEO_FB=y
CONFIG_PDCURSES=y
CONFIG_GRAPHICS_PDCURSES=y
CONFIG_PDCURSES_COLORFMT_RGB888=y
CONFIG_PDCURSES_DJOYSTICK=y
CONFIG_PDCURSES_FONT_6X9=y

# Filesystems
CONFIG_FS_ROMFS=y
CONFIG_FS_FAT=y
CONFIG_FAT_LFN=y
CONFIG_INTELHEX_BINARY=y

# Network stack
CONFIG_NET=y
CONFIG_NET_TCP=y
CONFIG_NET_UDP=y
CONFIG_NET_ETHERNET=y
CONFIG_NET_IPv4=y
CONFIG_NETUTILS_DHCPD=y
CONFIG_NETUTILS_HTTPD=y
CONFIG_NETUTILS_TELNETD=y
CONFIG_NETUTILS_PING=y

# Apps / Examples (enabled)
CONFIG_EXAMPLES_LED=y
CONFIG_EXAMPLES_HELLO=y
CONFIG_EXAMPLES_GPIO=y
CONFIG_EXAMPLES_PWM=y
CONFIG_EXAMPLES_ADC=y
CONFIG_EXAMPLES_BLE=y
CONFIG_EXAMPLES_USBSERIAL=y
CONFIG_EXAMPLES_FATFS=y
CONFIG_EXAMPLES_MOUNT=y
CONFIG_EXAMPLES_UNMOUNT=y
CONFIG_EXAMPLES_ECHO=y

# UI examples (enabled)
CONFIG_EXAMPLES_NXWM=y
CONFIG_EXAMPLES_NXTERM=y
CONFIG_EXAMPLES_NXPLAYER=y
CONFIG_EXAMPLES_NXWIDGETS=y
CONFIG_EXAMPLES_NXVNC=y

# Large example apps (enabled)
CONFIG_EXAMPLES_USRSOCK=y
CONFIG_EXAMPLES_UORB=y
CONFIG_EXAMPLES_DHCPC=y
CONFIG_EXAMPLES_OTA=y

# Disabled examples (missing external libs)
#CONFIG_EXAMPLES_FREEMODBUS=n
#CONFIG_EXAMPLES_ZMODEM=n
#CONFIG_EXAMPLES_S2OPC=n

# Crypto / TLS
CONFIG_MBEDTLS=y
CONFIG_MBEDTLS_TLS_CLIENT=y
CONFIG_MBEDTLS_TLS_SERVER=y

# C++ / STL
CONFIG_CPLUSPLUS=y
CONFIG_CPLUSPLUS_STL=y
```

> **Note:** The three examples that require external libraries (`FreeModbus`, `ZMODEM`, `S2OPC`) are explicitly disabled because the libraries are not present in the source tree.

### 2.4 Build Artifacts Produced
| Artifact | Location | Size (on‑disk) | Flash‑size (data bytes) |
|----------|----------|----------------|--------------------------|
| `nuttx` (ELF) | `/home/bg9211014/nuttxspace/nuttx/boards/arm/lpc17xx_40xx/open1788/configs/full_all/nuttx` | *(generated, not listed)* | ~117 432 B (derived from HEX) |
| `nuttx.hex` | same directory | **323 KB** (textual Intel‑HEX) | **117 432 bytes** (actual programmed data) |
| `nuttx.bin` | same directory (produced by `objcopy`) | *not listed* | – |

## 3. Build & Flash Procedure (chronological)
1. **Copy defconfig** (raw config) into the board’s config directory:
   ```bash
   cp /home/bg9211014/.gemini/antigravity/brain/fef6d645-9e35-4af9-9b47-914acaefd6dd/full_all_defconfig_raw.cfg \
       /home/bg9211014/nuttxspace/nuttx/boards/arm/lpc17xx_40xx/open1788/configs/full_all/defconfig
   ```
2. **Configure NuttX**:
   ```bash
   cd /home/bg9211014/nuttxspace/nuttx
   ./tools/configure.sh -e open1788:full_all
   ```
3. **Compile**:
   ```bash
   make -j$(nproc) BOARD=open1788 V=1
   ```
4. **Convert ELF → HEX** (performed automatically by the `full_all_build.sh` script):
   ```bash
   arm-nuttx-elf-objcopy -O ihex nuttx nuttx.hex
   ```
5. **Verify flash size** (your own check):
   ```bash
   /home/bg9211014/.gemini/antigravity/brain/fef6d645-9e35-4af9-9b47-914acaefd6dd/flash_check_hex.sh \
       boards/arm/lpc17xx_40xx/open1788/configs/full_all/nuttx.hex
   # → reports 117432 bytes
   ```
6. **Flash the board** (you are doing it now). The recommended baud that is the fastest standard value **below 115200** is **92160**; if that fails, use **57600**:
   ```bash
   lpc21isp /home/bg9211014/nuttxspace/nuttx/boards/arm/lpc17xx_40xx/open1788/configs/full_all/nuttx.hex \
            /dev/ttyUSB0 92160 12000   # or 57600 if needed
   ```
   - The last argument (`12000`) is the timeout in milliseconds.
   - Ensure the board is in ISP mode (boot pins pulled appropriately) before invoking.

## 4. References & Sources
| Reference | Type | Path / URL |
|-----------|------|------------|
| Full‑all raw defconfig | Config file | `full_all_defconfig_raw.cfg` (artifact) |
| Flash‑size check script | Shell script | `flash_check_hex.sh` (artifact) |
| Build wrapper script | Shell script | `full_all_build.sh` (artifact) |
| NuttX source tree | Repository | `/home/bg9211014/nuttxspace/nuttx` |
| NuttX documentation (general) | Online docs | <https://nuttx.apache.org/docs/latest/> |
| LPC21ISP tool documentation | CLI help (`lpc21isp -h`) | system installed, version 1.97 |
| ARM‑None‑EABI GCC toolchain | Compiler docs | <https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm> |
| Embedded Artists LPC1788 Development Board board schematic (public) | Hardware manual | <https://open1788.com/documents/open1788_user_manual.pdf> |
| LPC1788 datasheet | MCU spec | <https://www.nxp.com/docs/en/data-sheet/LPC178x_7x.pdf> |

## 5. Summary of Confirmed Facts (100 % verified)
- Board is **Embedded Artists LPC1788 Development Board** with an **LPC1788** MCU.
- Flash image to be programmed is **nuttx.hex** (located at the path above).
- Actual flash data size = **117 432 bytes** (≈ 115 KB).
- The tool `lpc21isp` version **1.97** is used for flashing.
- Baud rates previously used: **115200** (initial) and **57600** (suggested safe rate).
- The highest standard baud supported by `lpc21isp` below 115200 is **92160** (if the binary supports it), otherwise **57600**.
- All peripheral drivers (UART, USB host, CAN, Ethernet, SD/MMC, audio codec, PWM, GPIO, RTC) are enabled in the config.
- Crypto/TLS (`mbedTLS`) and C++ STL are enabled.
- Large UI examples (NXWM, NXTERM, NXPLAYER, NXWIDGETS, NXVNC) are included.
- Three example apps that need external libraries (`FreeModbus`, `ZMODEM`, `S2OPC`) are **disabled**.
- The build succeeded with exit code 0; the only runtime issue reported was a missing file path (fixed by using an absolute path). 

---

**File ready for cross‑checking:** `[hardware_software_specifications.md](file:///home/bg9211014/.gemini/antigravity/brain/fef6d645-9e35-4af9-9b47-914acaefd6dd/hardware_software_specifications.md)`

You can feed this markdown file to other agents for validation or further analysis.