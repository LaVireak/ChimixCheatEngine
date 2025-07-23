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

# Find installer file(s) in output directory (commonly .exe or .msi)
$installerFiles = Get-ChildItem -Path $installerOutputDir -Include *.msi,*.exe -File | Where-Object { $_.Name -ne 'ChimixCheatEngine.exe' }
# Find installer file(s) in dist directory (UI installer)
$distDir = Join-Path $workspaceRoot 'desktop-app\dist'
$distInstallers = @()
if (Test-Path $distDir) {
    $distInstallers = Get-ChildItem -Path $distDir -Include *Setup.exe,*Portable.exe -File
}

if ($installerFiles.Count -eq 0 -and $distInstallers.Count -eq 0) {
    # Fallback: move ChimixCheatEngine.exe as release binary
    $exeFile = Join-Path $installerOutputDir 'ChimixCheatEngine.exe'
    if (Test-Path $exeFile) {
        $dest = Join-Path $releaseDir 'ChimixCheatEngine.exe'
        Move-Item -Path $exeFile -Destination $dest -Force
        Write-Host "No installer found. Moved ChimixCheatEngine.exe to release folder as main binary."
        Write-Host "Automation complete. You may want to package this binary with an installer in the future."
    } else {
        Write-Error "No installer or main binary found in $installerOutputDir or dist."
        exit 1
    }
} else {
    # Move installer(s) to release directory from build output
    foreach ($file in $installerFiles) {
        $dest = Join-Path $releaseDir $file.Name
        Move-Item -Path $file.FullName -Destination $dest -Force
        Write-Host "Moved $($file.Name) to release folder."
    }
    # Move installer(s) to release directory from dist output
    foreach ($file in $distInstallers) {
        $dest = Join-Path $releaseDir $file.Name
        Copy-Item -Path $file.FullName -Destination $dest -Force
        Write-Host "Copied $($file.Name) from dist to release folder."
    }
    Write-Host "Automation complete. Installer(s) are now in the release folder."
}
