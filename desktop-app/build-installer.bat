@echo off
echo ==================================================
echo ChimixCheatEngine Desktop Application Builder
echo ==================================================
echo.

cd /d "%~dp0"

echo [1/4] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Testing application...
timeout /t 2 /nobreak >nul

echo.
echo [3/4] Building application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build application
    pause
    exit /b 1
)

echo.
echo [4/4] Build complete!
echo.
echo Built files are in the 'dist' folder:
dir /b dist\*.exe dist\*.msi 2>nul
echo.
echo You can now distribute the installer files.
echo.
pause
