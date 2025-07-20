const fs = require('fs');
const path = require('path');
const unpacked = path.join(__dirname, '../dist/win-unpacked/resources/engine/ChimixCheatEngine.exe');
if (!fs.existsSync(unpacked)) {
  console.error('[ERROR] ChimixCheatEngine.exe is missing from resources/engine in the packaged app!');
  process.exit(1);
} else {
  console.log('[OK] ChimixCheatEngine.exe found in resources/engine.');
}
