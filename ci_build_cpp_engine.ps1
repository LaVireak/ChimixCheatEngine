#!/usr/bin/env pwsh
# CI/CD build step for desktop-app/cpp-src (PowerShell)

cd desktop-app/cpp-src
if (!(Test-Path "build")) { New-Item -ItemType Directory -Path "build" | Out-Null }
cd build
# Clean CMake cache and files to avoid directory mismatch errors
if (Test-Path "CMakeCache.txt") { Remove-Item -Force "CMakeCache.txt" }
if (Test-Path "CMakeFiles") { Remove-Item -Recurse -Force "CMakeFiles" }
cmake .. -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release
cmake --build .
Write-Host "C++ engine build complete."

# Direct g++ build (for CI/manual fallback)
$cppFiles = (Get-ChildItem -Path "desktop-app/cpp-src" -Filter *.cpp | ForEach-Object { '"' + $_.FullName + '"' }) -join " "
Invoke-Expression "g++ -std=c++17 -O2 -Idesktop-app/include $cppFiles -o build/ChimixCheatEngine.exe -lpsapi -static"

# Copy the built binary to desktop-app/build for Electron packaging
$repoRoot = Resolve-Path "$PSScriptRoot/../.."
$targetDir = Join-Path $repoRoot "desktop-app/build"
if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir | Out-Null }
$targetPath = Join-Path $targetDir "ChimixCheatEngine.exe"
Copy-Item -Path "build/ChimixCheatEngine.exe" -Destination $targetPath -Force
