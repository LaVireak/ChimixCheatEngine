const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppName: () => ipcRenderer.invoke('get-app-name'),
    
    // Dialog methods
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    
    // External links
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    
    // Store methods
    getStoreValue: (key, defaultValue) => ipcRenderer.invoke('get-store-value', key, defaultValue),
    setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
    
    // Menu actions
    onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
    
    // Engine status
    onEngineStatus: (callback) => ipcRenderer.on('engine-status', callback),
    
    // Platform info
    platform: process.platform,
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Platform-specific features
contextBridge.exposeInMainWorld('platform', {
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux'
});

// Security: Remove Node.js globals
delete global.require;
delete global.exports;
delete global.module;
delete global.Buffer;
delete global.process;
delete global.global;
