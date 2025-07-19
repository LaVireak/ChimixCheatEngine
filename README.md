# ChimixCheatEngine

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078d4.svg)]()
[![Language](https://img.shields.io/badge/Language-C%2B%2B-blue.svg)]()
[![Framework](https://img.shields.io/badge/Framework-Electron-47848F.svg)]()
[![Download](https://img.shields.io/github/downloads/LaVireak/ChimixCheatEngine/total.svg)](https://github.com/LaVireak/ChimixCheatEngine/releases/latest)

**ChimixCheatEngine** is a memory scanner and editor designed for educational purposes and reverse engineering research. Built with modern C++ and Electron technologies, it provides an intuitive interface for memory analysis, universal value scanning, and real-time memory modification capabilities.

---

## System Requirements

### Minimum Requirements
- **OS**: Windows 10 (64-bit) or later
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50MB free space
- **Permissions**: Administrator access for memory operations

### Recommended Setup
- **OS**: Windows 11 (latest updates)
- **RAM**: 16GB for optimal performance
- **Antivirus**: Exclusion rules for memory scanning tools
- **UAC**: Enabled for security (application will request elevation)

---

## Features

### Memory Analysis

- **Universal Value Scanning**: Automatically detects multiple data types (int8, int16, int32, float, double, string)
- **Advanced Pattern Matching**: Hex byte pattern searching with wildcard support
- **Real-time Filtering**: Next scan functionality to narrow down memory results
- **Batch Operations**: Simultaneous modification of multiple memory addresses

### User Interface

- **Modern Desktop Application**: Clean interface built with Electron
- **Process Management**: Intuitive process attachment and monitoring tools
- **Real-time Communication**: WebSocket-based backend integration
- **Comprehensive Results Display**: Advanced memory result visualization and modification tools

### Core Engine

- **High-Performance C++ Backend**: Optimized memory scanning algorithms
- **Safe Memory Operations**: Secure memory reading and writing with proper error handling
- **Cross-Architecture Support**: Compatible with both 32-bit and 64-bit processes
- **Automatic Updates**: Built-in update system for seamless version management

## Usage

### Basic Operations

1. **Process Attachment**
   - Enter the target process name (e.g., `notepad.exe`)
   - Click "Attach to Process" or use the process selector

2. **Memory Scanning**
   - Input the value to search for in the scan field
   - Click "Start Scan" to begin automatic type detection
   - Review results with different data type interpretations

3. **Result Filtering**
   - Modify the value in the target application
   - Enter the new value and click "Next Scan"
   - Repeat the process to isolate target memory addresses

4. **Memory Modification**
   - Right-click on scan results to access modification options
   - Apply changes in real-time with immediate effect

### Advanced Features

- **Pattern Scanning**: Search using hex patterns with wildcard support (`48 8B ? ? 90`)
- **Memory Freezing**: Lock values to prevent application modification
- **Batch Processing**: Select and modify multiple memory addresses simultaneously

## Architecture

### Project Structure

```
ChimixCheatEngine/
├── desktop-app/              # Electron application
│   ├── src/                  # Frontend source code
│   │   ├── index.html        # Main application UI
│   │   ├── app.js           # Application logic
│   │   └── styles.css       # User interface styling
│   ├── cpp-src/             # C++ memory engine
│   │   ├── main.cpp         # Engine entry point
│   │   ├── MemoryScanner.*  # Core scanning functionality
│   │   ├── ProcessManager.* # Process management
│   │   └── Utils.*          # Utility functions
│   ├── main.js              # Electron main process
│   ├── preload.js           # Preload script for IPC
│   └── package.json         # Dependencies and build config
├── .github/workflows/       # CI/CD automation
└── README.md               # Documentation
```

### Technology Stack

- **Backend**: C++17 with Windows API integration
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework**: Electron for cross-platform desktop deployment
- **Communication**: WebSocket-based real-time IPC
- **Build System**: Node.js with electron-builder
- **CI/CD**: GitHub Actions for automated releases

## Development

### Build System

The project includes several build scripts for different scenarios:

- `build.bat` - Compile C++ engine only
- `build-installer.bat` - Complete build process including installer creation
- `npm run dev` - Development mode with live reloading
- `npm run build` - Production build with installer generation
- `npm run publish` - Build and publish to GitHub Releases

### Code Quality

- Modern C++17 standards with RAII and smart pointers
- Comprehensive error handling and logging
- Memory-safe operations with proper cleanup
- Clean UI/UX design patterns

## Legal and Ethical Use

**Important**: ChimixCheatEngine is designed exclusively for educational and research purposes.

### Permitted Use Cases

- Educational research and learning about memory management
- Reverse engineering for academic purposes
- Single-player game modification for personal use
- Security research and vulnerability analysis

### Prohibited Activities

- Modification of online or multiplayer games
- Commercial software exploitation
- Circumvention of software protection systems
- Any activities that violate terms of service or applicable laws

**Users assume full responsibility for compliance with applicable laws and software licenses.**

## Contributing

We welcome contributions from the community. Please ensure all contributions align with the project's educational mission.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement-name`)
3. Implement your changes with appropriate testing
4. Commit your changes (`git commit -m 'Add enhancement description'`)
5. Push to your branch (`git push origin feature/enhancement-name`)
6. Submit a Pull Request with a detailed description

### Code Standards

- Follow existing code formatting and conventions
- Include comprehensive error handling
- Add appropriate documentation for new features
- Ensure compatibility with supported Windows versions

## Support

For questions, bug reports, or feature requests:

- **Issues**: Use the GitHub Issues tracker
- **Discussions**: Participate in GitHub Discussions
- **Documentation**: Refer to the project wiki for detailed guides

## Acknowledgments

ChimixCheatEngine is inspired by the original Cheat Engine project and built using modern software development practices. We acknowledge the contributions of the reverse engineering and security research communities.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete terms and conditions.

---

**Memory analysis tools for educational and research purposes.**