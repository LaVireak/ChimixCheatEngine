@echo off
echo Building ChimixCheatEngine with MinGW...
@echo off
setlocal

echo Building C++ engine...

REM Create build directory if it doesn't exist
if not exist "cpp-src\build" mkdir cpp-src\build
cd cpp-src\build

REM Generate project files with CMake
cmake .. -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release

REM Build the project
cmake --build .

cd ../..
echo Build completed!
endlocal
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
