# 🧠 ChimixCheatEngine

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Windows](https://img.shields.io/badge/Platform-Windows-0078d4.svg)]()
[![C++](https://img.shields.io/badge/Language-C%2B%2B-blue.svg)]()
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow.svg)]()

A powerful, educational memory scanner and editor for Windows, built with modern C++ and Electron. ChimixCheatEngine provides an intuitive interface for memory analysis, featuring universal value scanning and real-time memory modification capabilities.

## ✨ Features

### 🎯 **Universal Memory Scanning**
- **Smart Value Detection**: Automatically scans values as multiple data types (int8, int16, int32, float, double, string)
- **Cheat Engine-like Interface**: Simple value input without manual type selection
- **Advanced Filtering**: Next scan functionality to narrow down results
- **Pattern Scanning**: Hex byte pattern searching with wildcard support

### �️ **Modern Desktop Application**
- **Electron-based GUI**: Clean, dark-themed interface
- **Real-time Communication**: WebSocket-based backend integration
- **Process Management**: Easy process attachment and monitoring
- **Memory Results**: Comprehensive result display with modification tools

### ⚙️ **Core Engine**
- **C++ Backend**: High-performance memory scanning engine
- **Process Injection**: Safe memory reading and writing
- **Error Handling**: Comprehensive error management and logging
- **Cross-architecture**: Support for 32-bit and 64-bit processes

## 🚀 Quick Start

### Prerequisites
- **Windows 10/11**
- **Node.js** (for desktop application)
- **MinGW-w64** (for C++ compilation)
- **Administrator privileges** (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ChimixCheatEngine.git
   cd ChimixCheatEngine
   ```

2. **Build the engine**
   ```cmd
   cd desktop-app
   build.bat
   ```

3. **Install dependencies**
   ```cmd
   npm install
   ```

4. **Launch application**
   ```cmd
   launch.bat
   ```

## 🎮 Usage

### Basic Memory Scanning

1. **Attach to Process**
   - Enter process name (e.g., `notepad.exe`)
   - Click "Attach to Process"
   - Or use the process selector to browse running processes

2. **Scan for Values**
   - Enter any value in the scan field (numbers, text, etc.)
   - Click "Start Scan" - automatically detects all data types
   - View results showing different interpretations

3. **Filter Results**
   - Change the value in your target application
   - Enter the new value and click "Next Scan"
   - Repeat until you find the target memory address

4. **Modify Memory**
   - Right-click on results to modify values
   - Changes are applied in real-time

### Advanced Features

- **Pattern Scanning**: Use hex patterns like `48 8B ? ? 90` (? = wildcard)
- **Memory Freezing**: Lock values to prevent changes
- **Batch Operations**: Select multiple addresses for simultaneous modification

## � Project Structure

```
ChimixCheatEngine/
├── desktop-app/           # Electron desktop application
│   ├── src/              # Frontend source code
│   ├── cpp-src/          # C++ memory engine
│   ├── build/            # Compiled binaries
│   ├── main.js           # Electron main process
│   └── package.json      # Dependencies
├── build/                # Build artifacts
└── README.md             # This file
```

## 🛠️ Development

### Building from Source

1. **Install Dependencies**
   ```cmd
   # Install MinGW-w64
   # Add to PATH: C:\mingw64\bin
   
   # Install Node.js dependencies
   cd desktop-app
   npm install
   ```

2. **Compile C++ Engine**
   ```cmd
   cd desktop-app
   g++ -std=c++17 -O2 cpp-src/*.cpp -o build/ChimixCheatEngine.exe -lpsapi
   ```

3. **Run Development Mode**
   ```cmd
   npm run dev
   ```

### Code Architecture

- **Backend**: C++ memory scanning engine with WebSocket communication
- **Frontend**: Modern web technologies (HTML5, CSS3, JavaScript ES6+)
- **IPC**: WebSocket-based real-time communication
- **UI Framework**: Custom CSS with modern design principles

## ⚠️ Legal Disclaimer

**ChimixCheatEngine is intended for educational and research purposes only.**

- ✅ **Allowed**: Single-player games, educational research, reverse engineering learning
- ❌ **Prohibited**: Online/multiplayer games, commercial software exploitation, malicious activities

**Users are responsible for compliance with applicable laws and terms of service.**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the original Cheat Engine
- Built with modern web technologies and C++
- Community-driven development

---

**⭐ Star this repository if you find it useful!**

*Made with ❤️ for the reverse engineering and game development community*
