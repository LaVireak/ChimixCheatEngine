#!/usr/bin/env pwsh
# Automated build script for ChimixCheatEngine (Windows PowerShell)

# Ensure build directory exists
if (!(Test-Path "build")) { New-Item -ItemType Directory -Path "build" | Out-Null }

# Clean CMake cache and files to avoid generator conflicts
if (Test-Path "build/CMakeCache.txt") { Remove-Item -Force "build/CMakeCache.txt" }
if (Test-Path "build/CMakeFiles") { Remove-Item -Recurse -Force "build/CMakeFiles" }

# Build with CMake (MinGW Makefiles)
cmake -S desktop-app/cpp-src -B build -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release

# Direct g++ build (for CI/manual fallback)
$cppFiles = (Get-ChildItem -Path "desktop-app/cpp-src" -Filter *.cpp | ForEach-Object { '"' + $_.FullName + '"' }) -join " "
Invoke-Expression "g++ -std=c++17 -O2 -Idesktop-app/include $cppFiles -o build/ChimixCheatEngine.exe -lpsapi -static"

Write-Host "Build complete. Executable is in build/ChimixCheatEngine.exe"
