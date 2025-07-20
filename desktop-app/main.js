const { app, BrowserWindow, Menu, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

// Try to import WebSocket, fallback if not available
let WebSocket = null;
try {
    WebSocket = require('ws');
} catch (error) {
    console.log('ws module not available:', error.message);
}

// Try to import electron-store, fallback if not available
let Store = null;
let store = null;
try {
    Store = require('electron-store');
    store = new Store();
} catch (error) {
    console.log('electron-store not available, using fallback storage:', error.message);
    // Simple fallback storage
    store = {
        get: (key, defaultValue) => defaultValue,
        set: (key, value) => {},
        delete: (key) => {},
        clear: () => {}
    };
}

// Try to import electron-updater, fallback if not available
let autoUpdater = null;
try {
    const updaterModule = require('electron-updater');
    autoUpdater = updaterModule.autoUpdater;
} catch (error) {
    console.log('electron-updater not available:', error.message);
}

// Initialize store for persistent settings - moved above since store is now initialized conditionally

// Global variables
let mainWindow;
let engineProcess;
let wsServer;
let isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev') || !app.isPackaged;
let memoryEngine = null;
let isEngineReady = false;
let currentProcess = null;
let scanResults = [];

// Auto-updater configuration
if (!isDev && autoUpdater) {
    try {
        autoUpdater.checkForUpdatesAndNotify();
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;
    } catch (error) {
        console.error('Auto-updater configuration error:', error);
    }
}

// Auto-updater event handlers - only if autoUpdater is available
if (autoUpdater) {
    autoUpdater.on('checking-for-update', () => {
        console.log('Checking for update...');
        if (mainWindow) {
            mainWindow.webContents.send('update-checking');
        }
    });

    autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send('update-available', info.version);
        }
        // Show notification dialog
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `Update available: v${info.version}`,
            detail: 'A new version of ChimixCheatEngine is available. It will be downloaded automatically.',
            buttons: ['OK']
        });
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('Update not available');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available');
        }
        // Only show dialog if user manually checked for updates
        // We can track this with a flag or just show it for now
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'No Updates',
            message: 'You are using the latest version',
            detail: `Current version: v${APP_CONFIG.version}\nNo updates are available at this time.`,
            buttons: ['OK']
        });
    });

    autoUpdater.on('error', (err) => {
        console.log('Error in auto-updater:', err);
        if (mainWindow) {
            mainWindow.webContents.send('update-error', err.message);
        }
        dialog.showErrorBox('Update Error', `Failed to check for updates: ${err.message}`);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        console.log(log_message);
        if (mainWindow) {
            mainWindow.webContents.send('update-progress', progressObj);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded');
        if (mainWindow) {
            mainWindow.webContents.send('update-downloaded', info.version);
        }
        // Show dialog to user asking if they want to install now
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update ready',
            message: 'Update downloaded successfully. The application will restart to apply the update.',
            buttons: ['Restart now', 'Later'],
            defaultId: 0
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
}

// Paths
const ENGINE_PATH = isDev 
    ? path.join(__dirname, 'build', 'ChimixCheatEngine.exe')
    : path.join(process.resourcesPath, 'engine', 'ChimixCheatEngine.exe');

console.log('Development mode:', isDev);
console.log('Engine path:', ENGINE_PATH);
console.log('Engine exists:', fs.existsSync(ENGINE_PATH));

// App configuration
const APP_CONFIG = {
    name: 'ChimixCheatEngine',
    version: '1.0.10',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600
};

// Create the main application window
function createWindow() {
    // Get saved window bounds or use defaults
    const windowBounds = store.get('windowBounds', {
        width: APP_CONFIG.width,
        height: APP_CONFIG.height,
        x: undefined,
        y: undefined
    });

    // Create the browser window
    mainWindow = new BrowserWindow({
        ...windowBounds,
        minWidth: APP_CONFIG.minWidth,
        minHeight: APP_CONFIG.minHeight,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: !isDev
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        title: APP_CONFIG.name,
        titleBarStyle: 'default',
        show: false, // Don't show until ready
        frame: true,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        alwaysOnTop: false,
        skipTaskbar: false,
        backgroundColor: '#1a1a1a'
    });

    // Load the app
    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Start the engine backend
        startEngineBackend();
        
        // Start WebSocket server
        startWebSocketServer();
        
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    // Save window bounds when moved or resized
    mainWindow.on('resize', saveWindowBounds);
    mainWindow.on('move', saveWindowBounds);

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
        cleanup();
    });

    // Handle navigation
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    // Handle page errors
    mainWindow.webContents.on('crashed', () => {
        dialog.showErrorBox('Application Crashed', 'The application has crashed. Please restart.');
    });

    // Set up menu
    createMenu();
}

function saveWindowBounds() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        store.set('windowBounds', mainWindow.getBounds());
    }
}

function startEngineBackend() {
    try {
        // Check if engine executable exists
        if (!fs.existsSync(ENGINE_PATH)) {
            console.warn('ChimixCheatEngine.exe not found at:', ENGINE_PATH);
            console.log('Starting in mock mode...');
            
            // Send status to renderer
            if (mainWindow) {
                mainWindow.webContents.send('engine-status', { status: 'ready', mode: 'mock' });
            }
            return;
        }

        // Start the actual memory engine process
        console.log('Starting ChimixCheatEngine at:', ENGINE_PATH);
        
        engineProcess = spawn(ENGINE_PATH, [], {
            cwd: path.dirname(ENGINE_PATH),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        engineProcess.stdout.on('data', (data) => {
            console.log('Engine stdout:', data.toString());
        });

        engineProcess.stderr.on('data', (data) => {
            console.error('Engine stderr:', data.toString());
        });

        engineProcess.on('close', (code) => {
            console.log(`Engine process exited with code ${code}`);
            isEngineReady = false;
            
            if (mainWindow) {
                mainWindow.webContents.send('engine-status', { status: 'error', message: 'Engine process stopped' });
            }
        });

        engineProcess.on('error', (error) => {
            console.error('Failed to start engine process:', error);
            isEngineReady = false;
            
            if (mainWindow) {
                mainWindow.webContents.send('engine-status', { status: 'error', message: error.message });
            }
        });

        // Give the engine a moment to start
        setTimeout(() => {
            isEngineReady = true;
            if (mainWindow) {
                mainWindow.webContents.send('engine-status', { status: 'ready', mode: 'native' });
            }
        }, 2000);
        
    } catch (error) {
        console.error('Failed to start engine backend:', error);
        
        if (mainWindow) {
            mainWindow.webContents.send('engine-status', { status: 'error', message: error.message });
        }
    }
}

function startWebSocketServer() {
    // Check if WebSocket is available
    if (!WebSocket) {
        console.log('WebSocket module not available, skipping WebSocket server');
        if (mainWindow) {
            mainWindow.webContents.send('engine-status', { status: 'mock', message: 'WebSocket module not available' });
        }
        return;
    }

    const tryPort = (port) => {
        try {
            console.log(`Attempting to start WebSocket server on port ${port}`);
            wsServer = new WebSocket.Server({ 
                port: port,
                host: '127.0.0.1' // Explicitly bind to localhost
            });
            
            wsServer.on('connection', (ws) => {
                console.log('WebSocket client connected');
                
                // Send initial status
                ws.send(JSON.stringify({
                    type: 'connected',
                    message: 'WebSocket connection established'
                }));
                
                ws.on('message', (message) => {
                    try {
                        const data = JSON.parse(message);
                        handleWebSocketMessage(ws, data);
                    } catch (error) {
                        console.error('WebSocket message error:', error);
                    }
                });
                
                ws.on('close', () => {
                    console.log('WebSocket client disconnected');
                });
                
                ws.on('error', (error) => {
                    console.error('WebSocket client error:', error);
                });
            });
            
            wsServer.on('listening', () => {
                console.log(`WebSocket server successfully started on port ${port}`);
                if (mainWindow) {
                    mainWindow.webContents.send('engine-status', { 
                        status: 'ready', 
                        mode: 'websocket',
                        port: port 
                    });
                }
            });
            
            wsServer.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.log(`Port ${port} is busy, trying next port...`);
                    setTimeout(() => tryPort(port + 1), 1000);
                } else {
                    console.error('WebSocket server error:', error);
                    if (mainWindow) {
                        mainWindow.webContents.send('engine-status', { 
                            status: 'error', 
                            message: `WebSocket server error: ${error.message}` 
                        });
                    }
                }
            });
            
        } catch (error) {
            console.error('Failed to start WebSocket server:', error);
            if (mainWindow) {
                mainWindow.webContents.send('engine-status', { 
                    status: 'error', 
                    message: `Failed to start WebSocket server: ${error.message}` 
                });
            }
        }
    };
    
    tryPort(8080);
}

function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'attach':
            handleProcessAttach(ws, data);
            break;
            
        case 'getProcessList':
            handleGetProcessList(ws);
            break;
            
        case 'scan':
            handleMemoryScan(ws, data);
            break;
            
        case 'universalScan': // Keep for backward compatibility, redirect to regular scan
            handleMemoryScan(ws, data);
            break;
            
        case 'patternScan': // NEW: Dedicated pattern scanning
            handlePatternScan(ws, data);
            break;
            
        case 'modify':
            handleMemoryModify(ws, data);
            break;
            
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
            
        default:
            console.warn('Unknown message type:', data.type);
    }
}

function handleProcessAttach(ws, data) {
    if (!isEngineReady) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Memory engine not ready'
        }));
        return;
    }

    try {
        const processName = data.processName;
        console.log(`Attempting to attach to process: ${processName}`);
        
        // Use Node.js to find the process
        const command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Process search error:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Failed to search for process: ${processName}`
                }));
                return;
            }

            const lines = stdout.split('\n');
            const processLine = lines.find(line => line.includes(processName));
            
            if (processLine) {
                // Parse the CSV output to get PID
                const parts = processLine.split(',');
                if (parts.length >= 2) {
                    const pid = parts[1].replace(/"/g, '').trim();
                    
                    currentProcess = {
                        name: processName,
                        pid: parseInt(pid)
                    };
                    
                    console.log(`Successfully found process: ${processName} (PID: ${pid})`);
                    
                    ws.send(JSON.stringify({
                        type: 'processAttached',
                        data: currentProcess
                    }));
                } else {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Failed to parse process information for: ${processName}`
                    }));
                }
            } else {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Process not found: ${processName}`
                }));
            }
        });
    } catch (error) {
        console.error('Process attach error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to attach to process: ${error.message}`
        }));
    }
}

function handleMemoryScan(ws, data) {
    if (!currentProcess) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'No process attached'
        }));
        return;
    }

    try {
        console.log(`Universal scanning for value: ${data.value}`);

        if (data.scanMethod === 'first') {
            // Perform universal scan for first scan
            performUniversalValueScan(ws, data.value, data.scanMethod || 'exact');
        } else if (data.scanMethod === 'next') {
            // Filter existing results with new value
            setTimeout(() => {
                const newResults = filterUniversalScanResults(scanResults, data.value);
                scanResults = newResults; // Update the results

                ws.send(JSON.stringify({
                    type: 'scanResults',
                    data: newResults
                }));
            }, 1000);
        }

    } catch (error) {
        console.error('Memory scan error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Memory scan failed: ${error.message}`
        }));
    }
}

function handleMemoryModify(ws, data) {
    if (!currentProcess) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'No process attached'
        }));
        return;
    }

    try {
        console.log(`Modifying memory at ${data.address}: ${data.value}`);
        
        // For now, simulate memory modification
        // In a real implementation, this would communicate with the C++ engine
        setTimeout(() => {
            ws.send(JSON.stringify({
                type: 'memoryModified',
                data: { 
                    address: data.address, 
                    value: data.value, 
                    success: true 
                }
            }));
        }, 500);
    } catch (error) {
        console.error('Memory modify error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Memory modification failed: ${error.message}`
        }));
    }
}

function handleGetProcessList(ws) {
    if (!isEngineReady) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Memory engine not ready'
        }));
        return;
    }

    try {
        console.log('Fetching process list...');
        
        // Use tasklist command to get all running processes
        const command = 'tasklist /FO CSV';
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Process list error:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Failed to get process list'
                }));
                return;
            }

            const processes = [];
            const lines = stdout.split('\n');
            
            // Skip header line and process each line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        const processName = parts[0].replace(/"/g, '').trim();
                        const pid = parseInt(parts[1].replace(/"/g, '').trim());
                        
                        // Filter out system processes and processes with invalid names
                        if (processName && pid > 4 && 
                            !processName.startsWith('System') && 
                            !processName.startsWith('Registry') &&
                            processName.includes('.exe')) {
                            
                            processes.push({
                                name: processName,
                                pid: pid,
                                windowTitle: '' // Could be enhanced to get window titles
                            });
                        }
                    }
                }
            }

            // Sort processes by name
            processes.sort((a, b) => a.name.localeCompare(b.name));

            console.log(`Found ${processes.length} processes`);
            
            ws.send(JSON.stringify({
                type: 'processList',
                data: processes
            }));
        });
    } catch (error) {
        console.error('Process list error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to get process list: ${error.message}`
        }));
    }
}

function generateMockScanResults(value, scanType) {
    const results = [];
    const numResults = Math.floor(Math.random() * 10) + 3;
    
    for (let i = 0; i < numResults; i++) {
        // Generate realistic memory addresses
        const baseAddress = 0x00400000 + (Math.random() * 0x00100000);
        const address = '0x' + baseAddress.toString(16).toUpperCase().padStart(8, '0');
        
        // Generate values based on scan type
        let resultValue;
        switch (scanType) {
            case 'float':
                resultValue = (parseFloat(value) + (Math.random() - 0.5) * 10).toFixed(2);
                break;
            case 'string':
                resultValue = value;
                break;
            case 'integer':
            default:
                resultValue = parseInt(value) + Math.floor((Math.random() - 0.5) * 20);
                break;
        }
        
        results.push({
            address: address,
            value: resultValue,
            type: scanType
        });
    }
    
    return results;
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Scan',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'new-scan');
                    }
                },
                {
                    label: 'Open Results',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile'],
                            filters: [{ name: 'JSON Files', extensions: ['json'] }]
                        });
                        if (!result.canceled) {
                            mainWindow.webContents.send('menu-action', 'open-results', result.filePaths[0]);
                        }
                    }
                },
                {
                    label: 'Save Results',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'save-results');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Process Manager',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'process-manager');
                    }
                },
                {
                    label: 'Memory Scanner',
                    accelerator: 'CmdOrCtrl+M',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'memory-scanner');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'settings');
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Check for Updates',
                    accelerator: 'CmdOrCtrl+U',
                    click: () => {
                        if (!isDev && autoUpdater) {
                            try {
                                autoUpdater.checkForUpdates();
                                dialog.showMessageBox(mainWindow, {
                                    type: 'info',
                                    title: 'Checking for Updates',
                                    message: 'Checking for updates...',
                                    detail: 'The application will notify you if an update is available.',
                                    buttons: ['OK']
                                });
                            } catch (error) {
                                console.error('Manual update check error:', error);
                                dialog.showErrorBox('Update Check Failed', 'Unable to check for updates. Please try again later.');
                            }
                        } else {
                            dialog.showMessageBox(mainWindow, {
                                type: 'info',
                                title: 'Development Mode',
                                message: 'Update checking is disabled in development mode.',
                                detail: 'Updates are only available in the production build.',
                                buttons: ['OK']
                            });
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Documentation',
                    click: () => {
                        shell.openExternal('https://github.com/LaVireak/ChimixCheatEngine');
                    }
                },
                {
                    label: 'Report Bug',
                    click: () => {
                        shell.openExternal('https://github.com/LaVireak/ChimixCheatEngine/issues');
                    }
                },
                { type: 'separator' },
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About ChimixCheatEngine',
                            message: APP_CONFIG.name,
                            detail: `Version: ${APP_CONFIG.version}\n\nA beautiful memory scanner for educational purposes.\n\n⚠️ For educational use only!\nNever use on online/multiplayer games.`,
                            icon: path.join(__dirname, 'assets', 'icon.png')
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function cleanup() {
    // Stop engine process
    if (engineProcess && !engineProcess.killed) {
        engineProcess.kill();
    }
    
    // Stop WebSocket server
    if (wsServer) {
        wsServer.close();
    }
}

// App event handlers
app.whenReady().then(() => {
    createWindow();
    
    // Check for updates after the app is ready (only in production)
    if (!isDev && autoUpdater) {
        setTimeout(() => {
            try {
                autoUpdater.checkForUpdatesAndNotify();
            } catch (error) {
                console.error('Auto-updater check error:', error);
            }
        }, 3000); // Wait 3 seconds after startup
    }
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    cleanup();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    cleanup();
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
    return APP_CONFIG.version;
});

ipcMain.handle('get-app-name', () => {
    return APP_CONFIG.name;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
});

ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', () => {
    if (!isDev && autoUpdater) {
        try {
            autoUpdater.checkForUpdates();
            return true;
        } catch (error) {
            console.error('Check for updates error:', error);
            return false;
        }
    }
    return false;
});

ipcMain.handle('restart-and-install', () => {
    if (!isDev && autoUpdater) {
        try {
            autoUpdater.quitAndInstall();
        } catch (error) {
            console.error('Restart and install error:', error);
        }
    }
});

ipcMain.handle('get-update-status', () => {
    return {
        isDev: isDev,
        updateAvailable: false, // This will be updated by the updater events
        version: APP_CONFIG.version
    };
});

ipcMain.handle('get-store-value', (event, key, defaultValue) => {
    return store.get(key, defaultValue);
});

ipcMain.handle('set-store-value', (event, key, value) => {
    store.set(key, value);
});

// Handle protocol for deep linking (optional)
app.setAsDefaultProtocolClient('chimix-cheat-engine');

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (navigationEvent, url) => {
        navigationEvent.preventDefault();
        shell.openExternal(url);
    });
});

// Cleanup function
function cleanup() {
    console.log('Cleaning up application...');
    
    // Close WebSocket server
    if (wsServer) {
        wsServer.close();
        wsServer = null;
    }

    // Kill engine process (cross-platform)
    if (engineProcess && !engineProcess.killed) {
        console.log('Terminating engine process...');
        if (process.platform === 'win32') {
            // Use taskkill to forcefully kill the process tree on Windows
            const pid = engineProcess.pid;
            if (pid) {
                const { exec } = require('child_process');
                exec(`taskkill /PID ${pid} /T /F`, (err, stdout, stderr) => {
                    if (err) {
                        console.error('taskkill error:', err);
                    } else {
                        console.log('taskkill output:', stdout);
                    }
                });
            }
        } else {
            engineProcess.kill('SIGTERM');
            // Force kill if it doesn't close gracefully
            setTimeout(() => {
                if (engineProcess && !engineProcess.killed) {
                    console.log('Force killing engine process...');
                    engineProcess.kill('SIGKILL');
                }
            }, 3000);
        }
    }

    // Save window bounds
    saveWindowBounds();
}

// App event handlers
app.whenReady().then(() => {
    createWindow();
    startEngineBackend();
    startWebSocketServer();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    cleanup();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    cleanup();
});

app.on('will-quit', () => {
    cleanup();
});

console.log(`${APP_CONFIG.name} v${APP_CONFIG.version} starting...`);


function handleUniversalScan(ws, data) {
    // Redirect to regular scan for universal value scanning
    if (data.scanType === 'universal_value' || !data.scanType) {
        handleMemoryScan(ws, data);
    } else if (data.scanType === 'byte_pattern') {
        handlePatternScan(ws, data);
    } else {
        ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown scan type: ${data.scanType}`
        }));
    }
}

function handlePatternScan(ws, data) {
    if (!currentProcess) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'No process attached'
        }));
        return;
    }

    try {
        console.log(`Performing pattern scan: "${data.pattern}"`);
        performBytePatternScan(ws, data.pattern, data.scanMethod || 'exact');

    } catch (error) {
        console.error('Pattern scan error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Pattern scan failed: ${error.message}`
        }));
    }
}

function performUniversalValueScan(ws, value, scanMethod) {
    // Prepare scan data for multiple data types
    const scanRequests = prepareUniversalScanData(value);
    
    // Simulate universal scan (in real implementation, this would communicate with C++ engine)
    setTimeout(() => {
        const results = simulateUniversalValueScan(scanRequests, scanMethod);
        scanResults = results; // Store results for next scan
        
        ws.send(JSON.stringify({
            type: 'scanResults', // Changed from 'universalScanResults' to 'scanResults'
            data: results
        }));
    }, 1500);
}

function performBytePatternScan(ws, pattern, scanMethod) {
    // Parse hex pattern string
    const parsedPattern = parseHexPattern(pattern);
    
    if (!parsedPattern) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid hex pattern format'
        }));
        return;
    }

    // Simulate byte pattern scan
    setTimeout(() => {
        const results = simulateBytePatternScan(parsedPattern, scanMethod);
        
        ws.send(JSON.stringify({
            type: 'patternScanResults',
            data: results
        }));
    }, 1000);
}

function prepareUniversalScanData(inputValue) {
    const scanData = [];

    // Attempt to interpret as integer types
    const intValue = parseInt(inputValue);
    if (!isNaN(intValue)) {
        scanData.push({ type: 'int8', value: intValue & 0xFF });
        scanData.push({ type: 'int16', value: intValue & 0xFFFF });
        scanData.push({ type: 'int32', value: intValue });
    }

    // Attempt to interpret as float
    const floatValue = parseFloat(inputValue);
    if (!isNaN(floatValue)) {
        scanData.push({ type: 'float', value: floatValue });
        scanData.push({ type: 'double', value: floatValue });
    }

    // Always include as string
    scanData.push({ type: 'string', value: inputValue });

    return scanData;
}

function simulateUniversalValueScan(scanRequests, scanMethod) {
    const results = [];
    
    scanRequests.forEach(request => {
        const numResults = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < numResults; i++) {
            const baseAddress = 0x00400000 + (Math.random() * 0x00100000);
            const address = '0x' + baseAddress.toString(16).toUpperCase().padStart(8, '0');
            
            results.push({
                address: address,
                value: request.value,
                type: request.type,
                interpretation: `${request.type}: ${request.value}`
            });
        }
    });
    
    return results;
}

function parseHexPattern(pattern) {
    try {
        // Remove spaces and convert to uppercase
        const cleanPattern = pattern.replace(/\s+/g, '').toUpperCase();
        
        // Validate hex pattern (allow ? as wildcards)
        if (!/^[0-9A-F?]+$/.test(cleanPattern)) {
            return null;
        }
        
        // Convert to bytes and mask
        const bytes = [];
        const mask = [];
        
        for (let i = 0; i < cleanPattern.length; i += 2) {
            const byteStr = cleanPattern.substr(i, 2);
            if (byteStr.includes('?')) {
                bytes.push(0x00);
                mask.push(0x00);
            } else {
                bytes.push(parseInt(byteStr, 16));
                mask.push(0xFF);
            }
        }
        
        return { bytes, mask };
    } catch (error) {
        return null;
    }
}

function simulateBytePatternScan(parsedPattern, scanMethod) {
    const results = [];
    const numResults = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numResults; i++) {
        const baseAddress = 0x00400000 + (Math.random() * 0x00100000);
        const address = '0x' + baseAddress.toString(16).toUpperCase().padStart(8, '0');
        
        results.push({
            address: address,
            pattern: parsedPattern.bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
            type: 'byte_pattern'
        });
    }
    
    return results;
}

function filterUniversalScanResults(existingResults, newValue) {
    // Filter results that match the new value in any data type interpretation
    const newScanRequests = prepareUniversalScanData(newValue);
    const validValues = new Set(newScanRequests.map(req => req.value.toString()));
    
    // Keep results where the current value matches one of the new interpretations
    const filteredResults = existingResults.filter(result => {
        return validValues.has(result.value.toString());
    });
    
    // Update values to the new search value for matching results
    return filteredResults.map(result => {
        // Find the matching interpretation for this result type
        const matchingRequest = newScanRequests.find(req => req.type === result.type);
        if (matchingRequest) {
            return {
                ...result,
                value: matchingRequest.value,
                interpretation: `${matchingRequest.type}: ${matchingRequest.value}`
            };
        }
        return result;
    });
}

function filterMockScanResults(existingResults, newValue, scanType) {
    // Legacy function - keeping for compatibility
    return filterUniversalScanResults(existingResults, newValue);
}