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
REM Ensure build directory exists in desktop-app
if not exist "%SCRIPT_DIR%build" mkdir "%SCRIPT_DIR%build"
REM Copy the binary from cpp-src/build/ChimixEngine.exe to build/ChimixCheatEngine.exe
set TARGET_BIN=%SCRIPT_DIR%build\ChimixCheatEngine.exe
if exist "%BUILD_DIR%\ChimixEngine.exe" (
    if exist "%TARGET_BIN%" del "%TARGET_BIN%"
    copy /Y "%BUILD_DIR%\ChimixEngine.exe" "%TARGET_BIN%"
    echo Copied binary to: %TARGET_BIN%
) else (
    echo ERROR: Source binary not found at %BUILD_DIR%\ChimixEngine.exe
    exit /b 1
)
echo To run: Use 'npm start' to launch the desktop app
endlocal

echo.
REM ...existing code...
echo Build completed successfully!
echo Executable created: build\ChimixCheatEngine.exe
echo To run: Use 'npm start' to launch the desktop app
echo.
pause
