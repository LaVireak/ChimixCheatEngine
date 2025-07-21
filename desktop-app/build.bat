@echo off
echo Building ChimixCheatEngine with MinGW...
echo.

REM Create output directory
if not exist build mkdir build

echo Compiling with g++...

REM Compile with MinGW g++
g++ -std=c++17 -DUNICODE -D_UNICODE ^
    -I"desktop-app/cpp-src" ^
    -I"desktop-app" ^
    cpp-src\main.cpp ^
    cpp-src\ProcessManager.cpp ^
    cpp-src\MemoryScanner.cpp ^
    cpp-src\Utils.cpp ^
    -lkernel32 -luser32 -ladvapi32 -lpsapi ^
    -o build\ChimixCheatEngine.exe

if errorlevel 1 (
    echo.
    echo MinGW compilation failed!
    echo.
    echo Make sure you have MinGW-w64 installed and in your PATH.
    echo Download from: https://www.mingw-w64.org/downloads/
    echo.
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Executable created: build\ChimixCheatEngine.exe
echo To run: Use 'npm start' to launch the desktop app
echo.
pause
