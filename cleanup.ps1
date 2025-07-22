#!/usr/bin/env pwsh
# Cleanup script for ChimixCheatEngine workspace
# Safely deletes build artifacts, cache, and temp files

# Remove top-level build artifacts
Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "cpp-src\build" -ErrorAction SilentlyContinue

# Remove desktop-app build artifacts
Remove-Item -Recurse -Force "desktop-app\build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "desktop-app\dist" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "desktop-app\dist-new" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "desktop-app\cpp-src\build" -ErrorAction SilentlyContinue

# Remove node_modules (can be regenerated)
Remove-Item -Recurse -Force "desktop-app\node_modules" -ErrorAction SilentlyContinue

# Remove CMake cache and temp files from all folders
Get-ChildItem -Path . -Recurse -Include CMakeCache.txt,CMakeFiles,Makefile,cmake_install.cmake,*.tmp,*.log,*.cache,*.lock | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cleanup complete. Unnecessary files and folders have been deleted."
