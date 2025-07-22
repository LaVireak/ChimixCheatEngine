@echo off
echo Building ChimixCheatEngine with MinGW...
@echo off
setlocal

REM Get absolute path to the script's directory
set SCRIPT_DIR=%~dp0

REM The source directory is always relative to the project root
set SOURCE_DIR=%SCRIPT_DIR%cpp-src
set BUILD_DIR=%SOURCE_DIR%\build

REM Create build directory if it doesn't exist
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
cd /d "%BUILD_DIR%"

REM Generate project files with CMake using the correct source path
echo --- Running CMake...
cmake "%SOURCE_DIR%" -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release
if errorlevel 1 (
    echo.
    echo CMake generation failed!
    exit /b 1
)

REM Build the project
echo --- Building project with CMake/MinGW...
cmake --build . --config Release
if errorlevel 1 (
    echo.
    echo MinGW compilation failed!
    exit /b 1
)

cd /d "%SCRIPT_DIR%"
echo.
echo Build completed successfully!
echo Executable created: %BUILD_DIR%\ChimixEngine.exe
echo To run: Use 'npm start' to launch the desktop app
endlocal

REM Build the project
cmake --build .

cd ../..
echo Build completed!
endlocal

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
