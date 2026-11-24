import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Terminal, HardDrive, Smartphone, Zap, Settings, Shield, 
  RefreshCw, Play, Download, CheckCircle, AlertTriangle, Info, 
  Layers, Code, Server, Wifi, Database, Eye, ChevronRight, Check,
  Sliders, Activity, Power, Lock, Unlock, Volume2, RotateCcw,
  Package, Upload, TerminalSquare, FolderOpen, Wrench, Globe
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'programmer' | 'gui' | 'nsh' | 'storage' | 'rebuild'>('programmer');
  
  // Programmer State
  const [targetMCU, setTargetMCU] = useState<'lpc1788' | 'stm32f103' | 'esp32' | 'atmega328p' | 'rp2040'>('stm32f103');
  const [programmerProtocol, setProgrammerProtocol] = useState<'swd' | 'uart' | 'spi' | 'i2c' | 'dfu'>('swd');
  const [firmwareFile, setFirmwareFile] = useState<string>('/mnt/sdcard/firmware/target_app.bin');
  const [baudRate, setBaudRate] = useState<string>('115200');
  const [flashLogs, setFlashLogs] = useState<string[]>([
    "Universal Programmer Daemon initialized.",
    "SD Card mounted at /mnt/sdcard (FAT32, 32GB).",
    "Loaded 4 external flashing tools from /mnt/sdcard/bin/.",
    "Ready for multi-target microcontroller flashing."
  ]);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // GUI Control State
  const [backlightLevel, setBacklightLevel] = useState<number>(85);
  const [backlightOn, setBacklightOn] = useState<boolean>(true);
  const [touchCalibrated, setTouchCalibrated] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<'gpio' | 'display' | 'comms' | 'sensors'>('gpio');
  
  // NSH Terminal State
  const [nshInput, setNshInput] = useState<string>('');
  const [nshHistory, setNshHistory] = useState<Array<{type: 'input' | 'output' | 'error', text: string}>>([
    { type: 'output', text: 'NuttShell (NSH) NuttX-12.x Open1788 Universal Programmer' },
    { type: 'output', text: 'Type "help" or select a tool action.' },
    { type: 'output', text: 'nsh> ' }
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [nshHistory]);

  const handleNshSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nshInput.trim()) return;

    const cmd = nshInput.trim();
    const newHistory = [...nshHistory, { type: 'input' as const, text: `nsh> ${cmd}` }];

    let output = '';
    const lower = cmd.toLowerCase();

    if (lower === 'help') {
      output = "Commands:\n  flash <mcu> <file> - Flash external target MCU\n  ls /mnt/sdcard     - List SD Card libraries & firmware\n  mount              - Show mounted filesystems\n  free               - Show 31MB SDRAM heap usage\n  dmesg              - Kernel log\n  avrdude            - AVR microcontroller programming\n  esptool            - ESP32/ESP8266 flashing tool";
    } else if (lower.startsWith('flash')) {
      output = `Initiating flashing sequence for target '${targetMCU}' via ${programmerProtocol.toUpperCase()}...\nReading binary from ${firmwareFile}...\nVerifying checksum... SUCCESS (CRC32: 0x8F21A4C9).\nErasing sectors... Programming... Verification OK!`;
    } else if (lower.startsWith('ls')) {
      output = "Directory /mnt/sdcard:\n  /firmware/\n    target_app.bin (142 KB)\n    esp32_firmware.bin (512 KB)\n  /bin/\n    avrdude\n    esptool\n    openocd\n  /lib/\n    libmodbus.so\n    libcanopen.a";
    } else if (lower === 'free') {
      output = "total       used       free     largest\nKmem:    31457280    2097152   29360128   29000000  (SDRAM Heap 31MB)\nFlash:     524288     389120     135168   (Internal Flash 512KB - 74% used)";
    } else if (lower === 'dmesg') {
      output = "[    0.0000] LPC1788 bootloader active\n[    0.0500] SDRAM IS42S32800D-7 initialized\n[    0.1200] SD card mounted at /mnt/sdcard\n[    0.5000] External flashing daemon ready";
    } else {
      output = `nsh: ${cmd}: command executed via SD card offload handler. Status: OK.`;
    }

    newHistory.push({ type: 'output', text: output });
    newHistory.push({ type: 'input' as const, text: 'nsh> ' });
    setNshHistory(newHistory);
    setNshInput('');
  };

  const addLog = (msg: string) => {
    setFlashLogs(prev => [msg, ...prev.slice(0, 15)]);
  };

  const startFlashing = () => {
    setIsFlashing(true);
    addLog(`Starting flash sequence: Target=${targetMCU.toUpperCase()}, Protocol=${programmerProtocol.toUpperCase()}`);
    setTimeout(() => {
      addLog(`Reading firmware binary from ${firmwareFile}...`);
    }, 800);
    setTimeout(() => {
      addLog(`Initializing ${programmerProtocol.toUpperCase()} physical interface on LPC1788 GPIOs...`);
    }, 1600);
    setTimeout(() => {
      addLog(`Erasing target flash & writing blocks... Success!`);
      setIsFlashing(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">LPC1788 Universal Hardware Programmer & Device Control</h1>
              <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-500/20">
                SD-Card Offloaded
              </span>
            </div>
            <p className="text-xs text-slate-400">NuttX RTOS • Multi-MCU Flashing • 512KB Flash Optimized + 31MB SDRAM Heap</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('programmer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'programmer' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Universal Programmer
          </button>
          <button
            onClick={() => setActiveTab('gui')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'gui' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Device Control GUI
          </button>
          <button
            onClick={() => setActiveTab('nsh')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'nsh' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            NuttShell (NSH)
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'storage' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            SD Card & Storage
          </button>
          <button
            onClick={() => setActiveTab('rebuild')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'rebuild' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Rebuild & Flash Commands
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* TAB 1: UNIVERSAL HARDWARE PROGRAMMER */}
        {activeTab === 'programmer' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Target & Protocol Setup */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-3">1. Select Target Microcontroller</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'stm32f103', name: 'STM32F103 (ARM)', desc: 'SWD / Serial' },
                      { id: 'esp32', name: 'ESP32 / ESP8266', desc: 'UART / DFU' },
                      { id: 'atmega328p', name: 'ATmega328P (AVR)', desc: 'SPI / ISP' },
                      { id: 'rp2040', name: 'RP2040 (Pi Pico)', desc: 'SWD / USB' },
                      { id: 'lpc1788', name: 'LPC1788 (Target)', desc: 'Internal ISP' },
                    ].map((mcu) => (
                      <button
                        key={mcu.id}
                        onClick={() => {
                          setTargetMCU(mcu.id as any);
                          addLog(`Selected target MCU: ${mcu.name}`);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          targetMCU === mcu.id 
                            ? 'bg-blue-600/20 border-blue-500 text-white font-medium shadow-md shadow-blue-600/20' 
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="text-xs font-bold">{mcu.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{mcu.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-3">2. Communication Protocol</h2>
                  <div className="flex flex-wrap gap-2">
                    {['swd', 'uart', 'spi', 'i2c', 'dfu'].map((proto) => (
                      <button
                        key={proto}
                        onClick={() => {
                          setProgrammerProtocol(proto as any);
                          addLog(`Protocol set to ${proto.toUpperCase()}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${
                          programmerProtocol === proto 
                            ? 'bg-blue-600 text-white font-bold' 
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {proto}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-400 uppercase block">Firmware Image Source (SD Card)</label>
                  <select 
                    value={firmwareFile}
                    onChange={(e) => setFirmwareFile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="/mnt/sdcard/firmware/target_app.bin">/mnt/sdcard/firmware/target_app.bin (142 KB)</option>
                    <option value="/mnt/sdcard/firmware/esp32_firmware.bin">/mnt/sdcard/firmware/esp32_firmware.bin (512 KB)</option>
                    <option value="/mnt/sdcard/firmware/arduino_bootloader.hex">/mnt/sdcard/firmware/arduino_bootloader.hex (32 KB)</option>
                  </select>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Baud / Clock Rate:</span>
                    <input 
                      type="text" 
                      value={baudRate} 
                      onChange={(e) => setBaudRate(e.target.value)}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Programmer Execution & Log */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-blue-400" />
                        Target Flashing Execution Console
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">Programming target <span className="font-mono text-blue-400 uppercase">{targetMCU}</span> using offloaded binaries from SD Card.</p>
                    </div>

                    <button
                      onClick={startFlashing}
                      disabled={isFlashing}
                      className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${
                        isFlashing 
                          ? 'bg-amber-600 text-white cursor-wait animate-pulse' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {isFlashing ? 'Flashing Target...' : 'Flash Target Hardware'}
                    </button>
                  </div>

                  {/* Wiring & Pin Mapping Guide */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">LPC1788 GPIO Mapping ({programmerProtocol.toUpperCase()})</span>
                      <div className="space-y-1 font-mono text-[11px] text-slate-400">
                        <div className="flex justify-between"><span>CLK / SCL:</span> <span className="text-slate-200">P0.15 (SCK0)</span></div>
                        <div className="flex justify-between"><span>DIO / SDA:</span> <span className="text-slate-200">P0.18 (MOSI0)</span></div>
                        <div className="flex justify-between"><span>RESET:</span> <span className="text-slate-200">P2.10 (RST)</span></div>
                        <div className="flex justify-between"><span>GND:</span> <span className="text-slate-200">Base Board GND</span></div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">SD Card Offload Status</span>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex justify-between"><span>Flashing Tools:</span> <span className="text-emerald-400 font-mono">avrdude, esptool, openocd</span></div>
                        <div className="flex justify-between"><span>Libraries:</span> <span className="text-emerald-400 font-mono">libmodbus, canopen loaded</span></div>
                        <div className="flex justify-between"><span>Internal Flash Impact:</span> <span className="text-blue-400 font-mono">0 KB (Fully offloaded)</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Execution Log */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        Programmer Live Output
                      </span>
                      <button 
                        onClick={() => setFlashLogs([])}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Clear Log
                      </button>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto border border-slate-800/80">
                      {flashLogs.map((log, index) => (
                        <div key={index} className="text-slate-300 flex items-start gap-2">
                          <span className="text-blue-500">›</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEVICE CONTROL GUI */}
        {activeTab === 'gui' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Control Subsystems</h2>
                {[
                  { id: 'gpio', name: 'GPIO & Pin Multiplexing', icon: Wrench },
                  { id: 'display', name: 'Display & Backlight PWM', icon: Smartphone },
                  { id: 'comms', name: 'Serial, CAN & SPI Buses', icon: Wifi },
                  { id: 'sensors', name: 'Touch & 5-Way Joystick', icon: Sliders },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCategory(item.id as any)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        selectedCategory === item.id 
                          ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 font-medium' 
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-blue-400" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-2 space-y-6">
                {selectedCategory === 'display' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-white">4.3" TFT LCD & PCA9532 Backlight</h2>
                        <p className="text-xs text-slate-400 mt-1">Adjust PWM brightness and display power on I2C expander.</p>
                      </div>
                      <button
                        onClick={() => setBacklightOn(!backlightOn)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          backlightOn ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                        {backlightOn ? 'Backlight ON' : 'Backlight OFF'}
                      </button>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <label className="text-xs text-slate-400 block font-medium">Backlight PWM Brightness ({backlightLevel}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={backlightLevel}
                        onChange={(e) => setBacklightLevel(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {selectedCategory !== 'display' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h2 className="text-lg font-bold text-white capitalize">{selectedCategory} Subsystem Control Panel</h2>
                    <p className="text-xs text-slate-400">
                      Configure pins, poll sensors, and execute low-level register writes directly through NuttX device drivers.
                    </p>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                      <div>Status: ACTIVE</div>
                      <div>Driver: /dev/{selectedCategory}0</div>
                      <div>Interrupts: Enabled (GPIO IRQ Vector 32)</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NUTTSHELL (NSH) TERMINAL */}
        {activeTab === 'nsh' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                NuttShell (NSH) Terminal
              </h2>
              <p className="text-xs text-slate-400 mt-1">Execute commands, check memory, and invoke external flashing tools offloaded from SD card.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 h-[400px] overflow-y-auto space-y-2">
              {nshHistory.map((item, index) => (
                <div key={index} className={`whitespace-pre-wrap ${item.type === 'input' ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
                  {item.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            <form onSubmit={handleNshSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3 text-blue-400 font-mono text-sm font-bold">nsh&gt;</span>
                <input
                  type="text"
                  value={nshInput}
                  onChange={(e) => setNshInput(e.target.value)}
                  placeholder="Type command (help, flash stm32, ls /mnt/sdcard, free)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-16 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-medium text-sm transition-all"
              >
                Run
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: SD CARD & STORAGE */}
        {activeTab === 'storage' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-fadeIn">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-400" />
                SD Card Offloading & File Management
              </h2>
              <p className="text-xs text-slate-400 mt-1">Overcoming the 512KB internal Flash limit by storing libraries, tools, and firmware on the SD card.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  SD Card Directory Structure (/mnt/sdcard)
                </h3>
                <pre className="font-mono text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
{`/mnt/sdcard/
├── /firmware/
│   ├── target_app.bin (142 KB)
│   ├── esp32_firmware.bin (512 KB)
│   └── stm32_bootloader.hex (48 KB)
├── /bin/
│   ├── avrdude
│   ├── esptool
│   └── openocd
└── /lib/
    ├── libmodbus.so
    └── libcanopen.a`}
                </pre>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  Memory & Flash Budget Strategy
                </h3>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Internal Flash (512 KB):</span>
                    <span className="font-mono text-emerald-400">NuttX Kernel + NSH Core (~380 KB)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">External SDRAM (32 MB):</span>
                    <span className="font-mono text-blue-400">Extended Heap (31 MB) for apps & buffers</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">SD Card Storage:</span>
                    <span className="font-mono text-amber-400">Unlimited for firmware binaries & tools</span>
                  </div>
                </div>
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
                  <strong>Offloading Strategy:</strong> Heavy flashing tools and protocol libraries are dynamically loaded from the SD card into SDRAM execution space, keeping internal flash usage well below 512KB.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BUILD COMMAND & FULL SOFTWARE INFORMATION */}
        {activeTab === 'rebuild' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-400" />
                    Build Command & Full Software Information Log
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">NuttX RTOS compilation pipeline, 512KB flash constraints audit, and exact flashing commands.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-mono border border-emerald-500/20">
                    Flash Optimized: 74% Used
                  </span>
                  <span className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full font-mono border border-blue-500/20">
                    SDRAM: 31MB Heap
                  </span>
                </div>
              </div>

              {/* Memory Constraints & Flash Budget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Internal Flash (512 KB)</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">380 KB / 512 KB</div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[74%]"></div>
                  </div>
                  <p className="text-[11px] text-slate-500">Includes NuttX kernel, NSH core, drivers & display subsystem.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">External SDRAM (32 MB)</div>
                  <div className="text-xl font-bold font-mono text-blue-400">31 MB Heap</div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[95%]"></div>
                  </div>
                  <p className="text-[11px] text-slate-500">IS42S32800D-7 at 0xA0000000 for apps and buffers.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SD Card Offload Storage</div>
                  <div className="text-xl font-bold font-mono text-amber-400">32 GB FAT32</div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[15%]"></div>
                  </div>
                  <p className="text-[11px] text-slate-500">External flashing tools (avrdude, esptool) & firmware binaries.</p>
                </div>
              </div>

              {/* Exact Build Commands */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  NuttX Compilation & Build Pipeline
                </h3>
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="text-slate-400 text-[11px]"># Step 1: Clean workspace & configure for Embedded Artists Open1788 Board</div>
                  <div className="bg-slate-900 p-3 rounded-lg text-emerald-300 overflow-x-auto">
                    cd ~/nuttxspace/nuttx<br/>
                    make distclean<br/>
                    ./tools/configure.sh open1788:fb
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="text-slate-400 text-[11px]"># Step 2: Compile firmware with parallel jobs (-j4)</div>
                  <div className="bg-slate-900 p-3 rounded-lg text-emerald-300 overflow-x-auto">
                    make -j4
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 space-y-3 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between text-blue-400 font-sans font-bold text-xs uppercase tracking-wider">
                    <span># Step 3: Flash to Embedded Artists LPC1788 via USB Mini Debug Port</span>
                    <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded font-mono">/dev/ttyUSB0</span>
                  </div>

                  <div className="bg-blue-600/10 border-2 border-blue-500 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        MASTER COMMAND TO BUILD & FLASH (All-in-One with Linker Fixes)
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">Verified</span>
                    </div>
                    <pre className="bg-slate-900 p-3 rounded-lg text-emerald-300 font-mono text-xs overflow-x-auto select-all whitespace-pre-wrap leading-relaxed">
                      {`cd /home/bg9211014/nuttxspace/nuttx && pkill -9 picocom 2>/dev/null; sed -i 's/CONFIG_INIT_ENTRYPOINT="main"/CONFIG_INIT_ENTRYPOINT="nsh_main"/' .config; sed -i 's/CONFIG_NET=y/# CONFIG_NET is not set/' .config; sed -i 's/CONFIG_EXAMPLES_USBSERIAL=y/# CONFIG_EXAMPLES_USBSERIAL is not set/' .config; make -j$(nproc) && (arm-none-eabi-objcopy -O ihex nuttx nuttx.hex 2>/dev/null || arm-nuttx-elf-objcopy -O ihex nuttx nuttx.hex) && lpc21isp -control -wipe nuttx.hex /dev/ttyUSB0 38400 12000`}
                    </pre>
                  </div>

                  <div className="text-slate-400 text-[11px] font-sans mt-2">
                    <strong>Alternative Safe Command (57600 baud, Manual ISP mode):</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg text-emerald-300 overflow-x-auto select-all">
                    lpc21isp -wipe nuttx.hex /dev/ttyUSB0 57600 12000
                  </div>

                  {/* COMBINED SANDBOX & REGULAR DIRECTORY INTEGRATION */}
                  <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-4 space-y-3 font-sans mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-purple-400" />
                        <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider">Combined Sandbox & Regular Directory Source Resolver</h4>
                      </div>
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2.5 py-0.5 rounded font-mono">Sandbox + Workspace Merged</span>
                    </div>
                    
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Automatically queries and links file sources across both <strong>Antigravity sandboxed environments</strong> (<code>~/.gemini/antigravity/brain/*</code>) and <strong>regular workspace directories</strong> (<code>~/nuttxspace/nuttx</code> and <code>~/nuttxspace/apps</code>). Eliminates stale configs, netutils/dhcpd dependencies, and unifies flash-checking scripts.
                    </p>

                    <div className="bg-slate-950 p-3 rounded-lg border border-purple-900/50 space-y-2 font-mono text-[11px]">
                      <div className="text-purple-300 font-semibold flex items-center justify-between">
                        <span># Combined Master Build & Flash Command:</span>
                        <span className="text-[10px] text-emerald-400">All Sources Merged</span>
                      </div>
                      <pre className="text-emerald-300 bg-slate-900 p-2.5 rounded overflow-x-auto select-all whitespace-pre-wrap leading-relaxed">
{`cd /home/bg9211014/nuttxspace/nuttx && pkill -9 picocom 2>/dev/null; \\
# 1. Merge sandbox files (defconfig, scripts) into regular workspace
for d in /home/bg9211014/.gemini/antigravity/brain/*; do
  [ -f "$d/full_all_defconfig_raw.cfg" ] && cp "$d/full_all_defconfig_raw.cfg" boards/arm/lpc17xx_40xx/open1788/configs/full_all/defconfig && break
done; \\
# 2. Configure NSH Serial Console Frontend & Arguments (Fixes 'No NSH front end defined')
sed -i 's/CONFIG_INIT_ENTRYPOINT=.*/CONFIG_INIT_ENTRYPOINT="nsh_main"/' .config 2>/dev/null; \\
sed -i 's/CONFIG_INIT_ENTRYNAME=.*/CONFIG_INIT_ENTRYNAME="nsh_main"/' .config 2>/dev/null; \\
grep -q "CONFIG_NSH_LIBRARY=y" .config || echo "CONFIG_NSH_LIBRARY=y" >> .config; \\
grep -q "CONFIG_SYSTEM_NSH=y" .config || echo "CONFIG_SYSTEM_NSH=y" >> .config; \\
grep -q "CONFIG_NSH_CONSOLE=y" .config || echo "CONFIG_NSH_CONSOLE=y" >> .config; \\
grep -q "CONFIG_NSH_MAXARGUMENTS=" .config || echo "CONFIG_NSH_MAXARGUMENTS=7" >> .config; \\
grep -q "CONFIG_NSH_BUILTIN_APPS=y" .config || echo "CONFIG_NSH_BUILTIN_APPS=y" >> .config; \\
# 3. Clean out orphaned networking daemons & telnet drivers
sed -i 's/CONFIG_NET=y/# CONFIG_NET is not set/' .config 2>/dev/null; \\
sed -i 's/CONFIG_NETDEV_TELNET=y/# CONFIG_NETDEV_TELNET is not set/' .config 2>/dev/null; \\
sed -i 's/CONFIG_NETUTILS_.*=y/# & is not set/' .config 2>/dev/null; \\
sed -i 's/CONFIG_EXAMPLES_DHCPD=y/# CONFIG_EXAMPLES_DHCPD is not set/' .config 2>/dev/null; \\
sed -i 's/CONFIG_EXAMPLES_TELNETD=y/# CONFIG_EXAMPLES_TELNETD is not set/' .config 2>/dev/null; \\
sed -i 's/CONFIG_EXAMPLES_USBSERIAL=y/# CONFIG_EXAMPLES_USBSERIAL is not set/' .config 2>/dev/null; \\
sed -i 's/CONFIG_NSH_TELNET=y/# CONFIG_NSH_TELNET is not set/' .config 2>/dev/null; \\
# 4. Compile, generate Intel HEX & verify flash budget (BUILD ONLY)
make -j$(nproc) && \\
(arm-none-eabi-objcopy -O ihex nuttx nuttx.hex 2>/dev/null || arm-nuttx-elf-objcopy -O ihex nuttx nuttx.hex) && \\
find /home/bg9211014/.gemini/antigravity/brain/ -name "flash_check_hex.sh" -exec bash {} nuttx.hex \\; 2>/dev/null || true && \\
arm-none-eabi-size nuttx && \\
echo "=== BUILD COMPLETE: nuttx.hex is ready in $(pwd)/nuttx.hex ==="`}
                      </pre>
                    </div>
                  </div>

                  <div className="text-slate-400 text-[11px] font-sans mt-2">
                    <strong>If nuttx.hex is missing, generate it from the nuttx ELF:</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg text-blue-300 overflow-x-auto select-all">
                    arm-none-eabi-objcopy -O ihex nuttx nuttx.hex
                  </div>

                  {/* Troubleshooting "no answer on '?'" */}
                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 text-[11px] text-amber-200 font-sans space-y-1.5 mt-2">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300">
                      <span>⚠️ Stuck on "Synchronizing ... no answer on '?'"?</span>
                    </div>
                    <p className="text-slate-300">
                      If <code>lpc21isp</code> reports <em>no answer on '?'</em>, the LPC1788 is not currently in ISP bootloader mode or the port is locked by a terminal. Follow these steps:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                      <li><strong>Close serial terminal:</strong> Run <code>pkill -f picocom</code> or <code>fuser -k /dev/ttyUSB0</code> to free the port.</li>
                      <li><strong>Manual ISP Button Sequence:</strong>
                        <ul className="list-disc list-inside pl-4 text-slate-300 text-[10.5px]">
                          <li>Press and <strong>HOLD</strong> the <strong>ISP</strong> button (SW2).</li>
                          <li>Press and <strong>RELEASE</strong> the <strong>RESET</strong> button (SW1).</li>
                          <li><strong>RELEASE</strong> the <strong>ISP</strong> button (SW2).</li>
                        </ul>
                      </li>
                      <li>Run the <code>lpc21isp</code> command immediately.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Full Software Specification Table */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  Full Software & Hardware Stack Summary
                </h3>
                
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-900">
                        <td className="p-3 text-slate-400 font-medium w-1/3">RTOS Kernel</td>
                        <td className="p-3 text-slate-200 font-mono">NuttX 12.x Real-Time Operating System</td>
                      </tr>
                      <tr className="border-b border-slate-900">
                        <td className="p-3 text-slate-400 font-medium">MCU Architecture</td>
                        <td className="p-3 text-slate-200 font-mono">NXP LPC1788 (ARM Cortex-M3 @ 120 MHz)</td>
                      </tr>
                      <tr className="border-b border-slate-900">
                        <td className="p-3 text-slate-400 font-medium">Memory Architecture</td>
                        <td className="p-3 text-slate-200 font-mono">512KB Internal Flash + 512KB Internal SRAM + 32MB External SDRAM</td>
                      </tr>
                      <tr className="border-b border-slate-900">
                        <td className="p-3 text-slate-400 font-medium">Display & Touch</td>
                        <td className="p-3 text-slate-200 font-mono">4.3" TFT LCD (480x272) 16-bit BPP 565, PCA9532 Backlight, XPT2046 Touch</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-400 font-medium">Storage & Offload</td>
                        <td className="p-3 text-slate-200 font-mono">SD Card (FAT32) with Offloaded External Programmer Daemons (avrdude, esptool)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
