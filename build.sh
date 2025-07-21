#!/usr/bin/env bash
set -e


echo "Build completed successfully!"
echo "Executable created: desktop-app/build/ChimixCheatEngine.exe"
echo "Building ChimixCheatEngine with CMake (MSYS2 MinGW64)..."
mkdir -p build
cd build
cmake -G "MinGW Makefiles" ..
cmake --build . --config Release
cd ..
echo "Build completed successfully!"
echo "Executable created: desktop-app/build/ChimixCheatEngine.exe"
