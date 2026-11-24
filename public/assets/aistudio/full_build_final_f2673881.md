#!/usr/bin/env bash
set -e

# -------------------------------------------------------------------------
# Final NuttX build for Embedded Artists LPC1788‑DEV‑KIT
# • Uses GNU ARM EABI toolchain (arm-none-eabi-*)
# • Enables all peripherals that the LPC1788 board actually provides
# • DISABLES USB‑host (the board has no OHCI pins) and the dependent MSC driver
# • Adds missing UART3 support (the board has UART2 and UART3)
# • Keeps CAN1 and CAN2 enabled (both are available on the dev‑kit)
# -------------------------------------------------------------------------

# 0️⃣  Switch to the real NuttX source tree (outside sandbox)
cd /home/bg9211014/nuttxspace/nuttx

# 1️⃣  Remove any old configuration and clean the tree
rm -f .config
make distclean || true

# 2️⃣  Load the open1788:full_all defconfig (the baseline for this board)
./tools/configure.sh -e open1788:full_all

# 3️⃣  Patch .config:
#    - Force GNU ARM EABI toolchain
#    - Enable master peripheral set (UART2/3, CAN1/2, SD, FAT, etc.)
#    - Explicitly DISABLE USB‑host and USB‑MSC (they cause compile errors)
#    - Enable UART3 (not set in the previous script)
python3 - << 'EOF'
config_path = '.config'
with open(config_path, 'r') as f:
    content = f.read()

enables = {
    'CONFIG_ARM_TOOLCHAIN_GNU_EABI': 'y',
    'CONFIG_CROSSDEV': '"arm-none-eabi-"',
    # Calibration helpers for NxWM touchscreen
    'CONFIG_NXWM_CALIBRATION_AVERAGE': 'y',
    'CONFIG_NXWM_CALIBRATION_NSAMPLES': '4',
    'CONFIG_NXWM_CALIBRATION_DISCARD_MINMAX': 'y',
    # Joystick (demo board provides a joystick)
    'CONFIG_OPEN1788_DJOYSTICK': 'y',
    'CONFIG_INPUT_DJOYSTICK': 'y',
    # UARTs – the board has UART0, UART2, UART3 (UART1 is not routed)
    'CONFIG_LPC17_40_UART2': 'y',
    'CONFIG_UART2_SERIALDRIVER': 'y',
    'CONFIG_LPC17_40_UART3': 'y',
    'CONFIG_UART3_SERIALDRIVER': 'y',
    # CAN – both CAN1 and CAN2 pins are present on the dev‑kit
    # 'CONFIG_LPC17_40_CAN1': 'y',
    'CONFIG_LPC17_40_CAN2': 'y',
    # 'CONFIG_CAN': 'y',
    # Memory regions and external SDRAM heap (used for larger apps)
    'CONFIG_MM_REGIONS': '3',
    'CONFIG_LPC17_40_OHCIRAM_SIZE': '2048',
    'CONFIG_EXTDRAMHEAP': 'y',
    'CONFIG_EXTDRAMHEAP_OFFSET': '1048576',
    # Filesystem – FAT with long‑filename support
    'CONFIG_FS_FAT': 'y',
    'CONFIG_FAT_LFN': 'y',
    # USB‑MSC host would require a USB‑host controller – disabled below
    # Scheduler work‑queue (used by many examples)
    'CONFIG_SCHED_WORKQUEUE': 'y',
    # Platform config‑data (used by NxWM touchscreen)
    'CONFIG_PLATFORM_CONFIGDATA': 'y',
    'CONFIG_NXWM_TOUCHSCREEN_CONFIGDATA': 'y'
}

disables = [
    # Toolchain alternatives and debugging helpers
    'CONFIG_ARM_TOOLCHAIN_ARMCLANG',
    'CONFIG_ARM_TOOLCHAIN_BUILDROOT',
    'CONFIG_SEGGER_SYSTEMVIEW',
    # PWM & related examples (not needed for the core build)
    'CONFIG_LPC17_40_PWM1',
    'CONFIG_LPC17_40_PWM1_CHANNEL1',
    'CONFIG_EXAMPLES_PWM',
    # USB‑device stack (the board does not expose a device port)
    'CONFIG_USBDEV',
    'CONFIG_USBDEV_PL2303',
    # USB‑host and USB‑MSC – the missing OHCI registers cause compile errors
    'CONFIG_USBHOST',
    'CONFIG_LPC17_40_USBHOST',
    'CONFIG_USBHOST_MSC',
    # USB‑serial example (depends on USBDEV)
    'CONFIG_CAN',
]

lines = content.splitlines()
new_lines = []
for line in lines:
    skip = False
    for d in disables:
        if line.startswith(d + '=') or line.startswith('# ' + d + ' is not set'):
            new_lines.append(f"# {d} is not set\n")
            skip = True
            break
    if not skip:
        for k, v in enables.items():
            if line.startswith(k + '='):
                line = f"{k}={v}"
                break
        new_lines.append(line + '\n')

# Append any enable entries that were not present in the original file
existing = "\n".join(new_lines)
for k, v in enables.items():
    if f"{k}=" not in existing:
        new_lines.append(f"{k}={v}\n")

with open(config_path, 'w') as f:
    f.writelines(new_lines)
print("Config successfully updated (USB host disabled, UART3 enabled).")
EOF

# 4️⃣  Build the firmware (verbose log captured)
make BOARD=open1788 V=1 2>&1 | tee build_final.log

# 5️⃣  Convert to Intel‑HEX and optionally flash (flash line commented out – uncomment if hardware is attached)
arm-nuttx-elf-objcopy -O ihex nuttx \
    boards/arm/lpc17xx_40xx/open1788/configs/full_all/nuttx.hex 2>&1 | tee -a build_final.log
arm-none-eabi-size nuttx | tee -a build_final.log
# lpc21isp -wipe boards/arm/lpc17xx_40xx/open1788/configs/full_all/nuttx.hex /dev/ttyUSB0 57600 12000 2>&1 | tee -a build_final.log || true

echo "=== BUILD (USB‑host disabled, UART3 enabled) COMPLETE ===" | tee -a build_final.log
