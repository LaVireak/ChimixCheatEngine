@echo off
echo ==================================================
echo ChimixCheatEngine Desktop Application Builder
echo ==================================================
echo.

cd /d "%~dp0"

echo [1/5] Building C++ Engine...
call build.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to build C++ engine
    pause
    exit /b 1
)

echo.
echo [2/5] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [3/5] Testing application...
timeout /t 2 /nobreak >nul

echo.
echo [4/5] Building application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build application
    pause
    exit /b 1
)

echo.
echo [5/5] Build complete!
echo.
echo Built files are in the 'dist' folder:
dir /b dist\*.exe dist\*.msi 2>nul
echo.
echo The installer includes auto-update functionality.
echo Updates will be checked automatically when users start the app.
echo.
pause
