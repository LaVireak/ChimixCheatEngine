#!/usr/bin/env bash
set -e


echo "Building ChimixCheatEngine with MSYS2 MinGW64..."
echo "G++ version:"
which g++
g++ --version
echo "Searching for json.hpp in /mingw64/include..."
find /mingw64/include -name json.hpp || true


# Create output directories
mkdir -p build
mkdir -p desktop-app/build


# Use the explicit MinGW-w64 g++ if available
if command -v x86_64-w64-mingw32-g++ >/dev/null 2>&1; then
    export CXX=x86_64-w64-mingw32-g++
else
    export CXX=g++
fi

$CXX -std=c++17 -DUNICODE -D_UNICODE \
    -I"/mingw64/include" \
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
