#!/usr/bin/env bash
set -e

echo "Building ChimixCheatEngine with MSYS2 MinGW64..."

# Create output directory
mkdir -p build

# Compile with g++ (MSYS2 MinGW64)
g++ -std=c++17 -DUNICODE -D_UNICODE \
    -I"desktop-app/cpp-src" \
    -I"desktop-app" \
    desktop-app/cpp-src/main.cpp \
    desktop-app/cpp-src/ProcessManager.cpp \
    desktop-app/cpp-src/MemoryScanner.cpp \
    desktop-app/cpp-src/Utils.cpp \
    -lkernel32 -luser32 -ladvapi32 -lpsapi \
    -o desktop-app/build/ChimixCheatEngine.exe

echo "Build completed successfully!"
echo "Executable created: desktop-app/build/ChimixCheatEngine.exe"
