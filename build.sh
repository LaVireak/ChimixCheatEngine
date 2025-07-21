#!/usr/bin/env bash
set -e


echo "Building ChimixCheatEngine with CMake..."
mkdir -p build
cd build
cmake ..
cmake --build . --config Release
cd ..
echo "Build completed successfully!"
echo "Executable created: desktop-app/build/ChimixCheatEngine.exe"
