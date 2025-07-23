# This PowerShell script automates building the installer and moving it to the release folder.

$ErrorActionPreference = 'Stop'

# Define paths
$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$installerScript = Join-Path $workspaceRoot 'desktop-app\build-installer.bat'
$installerOutputDir = Join-Path $workspaceRoot 'desktop-app\build'
$releaseDir = Join-Path $workspaceRoot 'release'

# Ensure release directory exists
if (!(Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

# Run the installer build script
Write-Host "Running installer build script..."
& $installerScript

# Find installer file(s) in output directory (commonly .exe or .msi)

# Find installer file(s) in output directory (commonly .exe or .msi)

 # Only copy the latest ChimixCheatEngine-*-Setup.exe from dist to release
$distDir = Join-Path $workspaceRoot 'desktop-app\dist'
if (Test-Path $distDir) {
    $latestSetup = Get-ChildItem -Path $distDir -Filter 'ChimixCheatEngine-*-Setup.exe' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -ne $latestSetup) {
        $dest = Join-Path $releaseDir $latestSetup.Name
        Copy-Item -Path $latestSetup.FullName -Destination $dest -Force
        Write-Host "Copied $($latestSetup.Name) from dist to release folder as latest setup installer."
        Write-Host "Automation complete. Use the setup.exe in the release folder to install the app."
    } else {
        Write-Error "No setup installer found in $distDir. Please check your build process."
        exit 1
    }
} else {
    Write-Error "Dist directory does not exist. Please check your build process."
    exit 1
}
