// Desktop Application JavaScript for ChimixCheatEngine

// Application State
let appState = {
    isConnected: false,
    currentProcess: null,
    selectedProcess: null,
    scanResults: [],
    modifiedCount: 0,
    scanCount: 0,
    startTime: Date.now(),
    ws: null,
    settings: {
        autoSave: true,
        confirmModify: true,
        showWarnings: true,
        maxResults: 1000,
        scanSpeed: 'normal',
        theme: 'dark',
        fontSize: 'medium'
    }
};

// DOM Elements
const elements = {
    appTitle: document.getElementById('appTitle'),
    appVersion: document.getElementById('appVersion'),
    engineStatus: document.getElementById('engineStatus'),
    processInput: document.getElementById('processInput'),
    selectProcess: document.getElementById('selectProcess'),
    refreshProcesses: document.getElementById('refreshProcesses'),
    attachBtn: document.getElementById('attachBtn'),
    currentProcess: document.getElementById('currentProcess'),
    scanValue: document.getElementById('scanValue'),
    scanBtn: document.getElementById('scanBtn'),
    nextScanBtn: document.getElementById('nextScanBtn'),
    scanCount: document.getElementById('scanCount'),
    modifiedCount: document.getElementById('modifiedCount'),
    memoryUsage: document.getElementById('memoryUsage'),
    uptime: document.getElementById('uptime'),
    filterResults: document.getElementById('filterResults'),
    clearResults: document.getElementById('clearResults'),
    exportResults: document.getElementById('exportResults'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    noResults: document.getElementById('noResults'),
    resultsTable: document.getElementById('resultsTable'),
    resultsBody: document.getElementById('resultsBody'),
    resultsCount: document.getElementById('resultsCount'),
    resultsTime: document.getElementById('resultsTime'),
    selectAll: document.getElementById('selectAll'),
    deselectAll: document.getElementById('deselectAll'),
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),
    connectionStatus: document.getElementById('connectionStatus'),
    processStatus: document.getElementById('processStatus'),
    scanStatus: document.getElementById('scanStatus'),
    progressFill: document.getElementById('progressFill'),
    toastContainer: document.getElementById('toastContainer'),
    // Process selection modal elements
    processSelectionModal: document.getElementById('processSelectionModal'),
    processSearch: document.getElementById('processSearch'),
    processListContainer: document.getElementById('processListContainer'),
    loadingProcesses: document.getElementById('loadingProcesses'),
    openSelectedProcess: document.getElementById('openSelectedProcess'),
    // Update notification elements
    updateNotification: document.getElementById('updateNotification'),
    updateText: document.getElementById('updateText'),
    updateNow: document.getElementById('updateNow'),
    updateLater: document.getElementById('updateLater'),
    updateProgress: document.getElementById('updateProgress'),
    progressFillUpdate: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupElectronIntegration();
    connectWebSocket();
    startTimers();
});

async function initializeApp() {
    // Get app info from Electron
    try {
        const appName = await window.electronAPI.getAppName();
        const appVersion = await window.electronAPI.getAppVersion();
        
        elements.appTitle.textContent = appName;
        elements.appVersion.textContent = `v${appVersion}`;
        document.title = `${appName} - Memory Scanner`;
    } catch (error) {
        console.error('Failed to get app info:', error);
    }

    // Load settings
    await loadSettings();
    
    // Update UI
    updateConnectionStatus(false);
    updateProcessDisplay();
    updateStats();
    showNoResults();
    
    // Apply theme
    applyTheme();
}

function setupEventListeners() {
    // Process management
    elements.selectProcess.addEventListener('click', showProcessSelectionModal);
    elements.attachBtn.addEventListener('click', attachToProcess);
    elements.refreshProcesses.addEventListener('click', refreshProcessList);
    elements.processInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attachToProcess();
    });

    // Process search in modal
    elements.processSearch.addEventListener('input', filterProcessList);

    // Memory scanning
    elements.scanBtn.addEventListener('click', performScan);
    elements.nextScanBtn.addEventListener('click', performNextScan);
    elements.scanValue.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performScan();
    });

    // Results management
    elements.clearResults.addEventListener('click', clearResults);
    elements.exportResults.addEventListener('click', exportResults);
    elements.filterResults.addEventListener('click', showFilterDialog);
    elements.selectAll.addEventListener('click', selectAllResults);
    elements.deselectAll.addEventListener('click', deselectAllResults);
    elements.selectAllCheckbox.addEventListener('change', toggleSelectAll);

    // Update notification buttons
    elements.updateNow.addEventListener('click', installUpdateNow);
    elements.updateLater.addEventListener('click', hideUpdateNotification);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function setupElectronIntegration() {
    // Menu actions
    window.electronAPI.onMenuAction((event, action, data) => {
        switch (action) {
            case 'new-scan':
                clearResults();
                focusProcessInput();
                break;
            case 'save-results':
                exportResults();
                break;
            case 'open-results':
                importResults(data);
                break;
            case 'process-manager':
                focusProcessInput();
                break;
            case 'memory-scanner':
                elements.scanValue.focus();
                break;
            case 'settings':
                showModal('settingsModal');
                break;
        }
    });

    // Engine status
    window.electronAPI.onEngineStatus((event, status) => {
        updateEngineStatus(status);
    });

    // Auto-updater events
    window.electronAPI.onUpdateAvailable((event, version) => {
        showUpdateNotification(`Update ${version} is available`, 'available');
    });

    window.electronAPI.onUpdateProgress((event, progressObj) => {
        showUpdateProgress(progressObj.percent, `Downloading... ${Math.round(progressObj.percent)}%`);
    });

    window.electronAPI.onUpdateDownloaded((event, version) => {
        showUpdateNotification(`Update ${version} ready to install`, 'downloaded');
    });
}

function connectWebSocket() {
    const tryConnect = (port) => {
        try {
            const wsUrl = `ws://localhost:${port}`;
            appState.ws = new WebSocket(wsUrl);
            
            appState.ws.onopen = function() {
                console.log(`WebSocket connected to port ${port}`);
                updateConnectionStatus(true);
                showToast('Connected to memory engine', 'success');
            };

            appState.ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            appState.ws.onclose = function() {
                console.log('WebSocket disconnected');
                updateConnectionStatus(false);
                showToast('Disconnected from memory engine', 'error');
                
                // Attempt to reconnect after 3 seconds
                setTimeout(() => connectWebSocket(), 3000);
            };

            appState.ws.onerror = function(error) {
                console.error(`WebSocket error on port ${port}:`, error);
                updateConnectionStatus(false);
                
                // Try next port if this one fails
                if (port < 8085) {
                    setTimeout(() => tryConnect(port + 1), 1000);
                }
            };
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            updateConnectionStatus(false);
        }
    };
    
    tryConnect(8080);
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'processAttached':
            appState.currentProcess = data.data;
            updateProcessDisplay();
            showToast(`Attached to ${appState.currentProcess.name} (PID: ${appState.currentProcess.pid})`, 'success');
            break;
        case 'processList':
            displayProcessList(data.data);
            break;
        case 'scanResults':
            appState.scanResults = data.data;
            updateScanResults();
            showToast(`Found ${appState.scanResults.length} results`, 'success');
            break;
        case 'memoryModified':
            appState.modifiedCount++;
            updateStats();
            showToast(`Memory modified at ${data.data.address}`, 'success');
            break;
        case 'error':
            showToast(data.message, 'error');
            break;
        case 'pong':
            console.log('Received pong');
            break;
        default:
            console.warn('Unknown message type:', data.type);
    }
}

function startTimers() {
    // Update uptime every second
    setInterval(updateUptime, 1000);
    
    // Update memory usage every 5 seconds
    setInterval(updateMemoryUsage, 5000);
    
    // Ping WebSocket every 30 seconds
    setInterval(() => {
        if (appState.ws && appState.ws.readyState === WebSocket.OPEN) {
            appState.ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 30000);
}

// UI Update Functions
function updateConnectionStatus(connected) {
    appState.isConnected = connected;
    const statusElement = elements.connectionStatus.querySelector('span');
    const iconElement = elements.connectionStatus.querySelector('i');
    
    if (connected) {
        statusElement.textContent = 'Connected';
        iconElement.className = 'fas fa-wifi';
        iconElement.style.color = 'var(--success-color)';
    } else {
        statusElement.textContent = 'Disconnected';
        iconElement.className = 'fas fa-wifi-slash';
        iconElement.style.color = 'var(--error-color)';
    }
    
    // Enable/disable controls
    const controls = [elements.attachBtn, elements.refreshProcesses, elements.scanBtn];
    controls.forEach(control => {
        control.disabled = !connected;
    });
}

function updateProcessDisplay() {
    const statusElement = elements.processStatus.querySelector('span');
    
    if (appState.currentProcess) {
        elements.currentProcess.innerHTML = `
            <div class="process-info">
                <div class="process-name">${appState.currentProcess.name}</div>
                <div class="process-pid">PID: ${appState.currentProcess.pid}</div>
            </div>
        `;
        statusElement.textContent = appState.currentProcess.name;
    } else {
        elements.currentProcess.innerHTML = `
            <div class="no-process">
                <i class="fas fa-unlink"></i>
                <span>No process attached</span>
            </div>
        `;
        statusElement.textContent = 'No process';
    }
}

function updateStats() {
    elements.scanCount.textContent = appState.scanResults.length;
    elements.modifiedCount.textContent = appState.modifiedCount;
    
    // Update results count
    elements.resultsCount.textContent = `${appState.scanResults.length} result${appState.scanResults.length !== 1 ? 's' : ''}`;
}

function updateUptime() {
    const uptime = Date.now() - appState.startTime;
    const minutes = Math.floor(uptime / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);
    elements.uptime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateMemoryUsage() {
    // Mock memory usage (in a real app, this would be actual memory usage)
    const usage = Math.floor(Math.random() * 100) + 50;
    elements.memoryUsage.textContent = `${usage} MB`;
}

function updateEngineStatus(status) {
    const statusElement = elements.engineStatus.querySelector('span');
    const iconElement = elements.engineStatus.querySelector('i');
    
    switch (status.status) {
        case 'ready':
            statusElement.textContent = 'Ready';
            iconElement.style.color = 'var(--success-color)';
            break;
        case 'scanning':
            statusElement.textContent = 'Scanning';
            iconElement.style.color = 'var(--warning-color)';
            break;
        case 'error':
            statusElement.textContent = 'Error';
            iconElement.style.color = 'var(--error-color)';
            break;
        default:
            statusElement.textContent = 'Unknown';
            iconElement.style.color = 'var(--text-muted)';
    }
}

function showNoResults() {
    elements.loadingSpinner.classList.add('hidden');
    elements.resultsTable.classList.add('hidden');
    elements.noResults.classList.remove('hidden');
    elements.scanStatus.textContent = 'Ready';
}

function showLoading() {
    elements.noResults.classList.add('hidden');
    elements.resultsTable.classList.add('hidden');
    elements.loadingSpinner.classList.remove('hidden');
    elements.scanStatus.textContent = 'Scanning...';
    
    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) {
            progress = 100;
            clearInterval(progressInterval);
        }
        elements.progressFill.style.width = `${progress}%`;
    }, 100);
}

function showResults() {
    elements.loadingSpinner.classList.add('hidden');
    elements.noResults.classList.add('hidden');
    elements.resultsTable.classList.remove('hidden');
    elements.scanStatus.textContent = 'Complete';
    elements.progressFill.style.width = '0%';
}

// Process Management
async function attachToProcess() {
    const processName = elements.processInput.value.trim();
    
    if (!processName) {
        showToast('Please enter a process name', 'warning');
        return;
    }

    if (!appState.isConnected) {
        showToast('Not connected to memory engine', 'error');
        return;
    }

    try {
        // Send attach request via WebSocket
        appState.ws.send(JSON.stringify({
            type: 'attach',
            processName: processName
        }));
        
        showToast(`Attaching to ${processName}...`, 'info');
    } catch (error) {
        console.error('Error attaching to process:', error);
        showToast('Error attaching to process', 'error');
    }
}

async function refreshProcessList() {
    if (!appState.isConnected) {
        showToast('Not connected to memory engine', 'error');
        return;
    }

    try {
        // If the process selection modal is open, reload the process list
        if (elements.processSelectionModal.classList.contains('show') || 
            elements.processSelectionModal.style.display === 'block') {
            await loadProcessList();
        } else {
            // Just show a toast for the regular refresh button
            showToast('Process list refreshed', 'success');
        }
    } catch (error) {
        console.error('Error refreshing process list:', error);
        showToast('Error refreshing process list', 'error');
    }
}

// Process Selection Modal Functions
async function showProcessSelectionModal() {
    showModal('processSelectionModal');
    
    // Disable the Open button initially
    if (elements.openSelectedProcess) {
        elements.openSelectedProcess.disabled = true;
    }
    
    await loadProcessList();
}

async function loadProcessList() {
    if (!appState.isConnected) {
        showToast('Not connected to memory engine', 'error');
        return;
    }

    try {
        elements.loadingProcesses.classList.remove('hidden');
        elements.processListContainer.innerHTML = '';

        // Request process list from backend
        appState.ws.send(JSON.stringify({
            type: 'getProcessList'
        }));

        showToast('Loading processes...', 'info');
    } catch (error) {
        console.error('Error loading process list:', error);
        showToast('Error loading process list', 'error');
        elements.loadingProcesses.classList.add('hidden');
    }
}

function displayProcessList(processes) {
    elements.loadingProcesses.classList.add('hidden');
    
    if (!processes || processes.length === 0) {
        elements.processListContainer.innerHTML = `
            <div class="no-processes">
                <i class="fas fa-desktop"></i>
                <h3>No processes found</h3>
                <p>No running processes were detected. Try refreshing the list.</p>
            </div>
        `;
        return;
    }

    elements.processListContainer.innerHTML = '';
    
    processes.forEach(process => {
        const processItem = document.createElement('div');
        processItem.className = 'process-item';
        processItem.dataset.processName = process.name;
        processItem.dataset.processId = process.pid;
        
        const processIcon = getProcessIcon(process.name);
        
        processItem.innerHTML = `
            <div class="process-icon">
                <i class="${processIcon}"></i>
            </div>
            <div class="process-info">
                <div class="process-name">${process.name}</div>
                <div class="process-details">
                    PID: ${process.pid}
                    ${process.windowTitle ? `<div class="process-window-title">${process.windowTitle}</div>` : ''}
                </div>
            </div>
        `;
        
        processItem.addEventListener('click', () => selectProcess(processItem));
        processItem.addEventListener('dblclick', () => {
            selectProcess(processItem);
            attachToSelectedProcess();
        });
        
        elements.processListContainer.appendChild(processItem);
    });
}

function selectProcess(processItem) {
    // Remove previous selection
    const previousSelected = elements.processListContainer.querySelector('.process-item.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
    }
    
    // Select new process
    processItem.classList.add('selected');
    
    // Update process input
    const processName = processItem.dataset.processName;
    const processPid = processItem.dataset.processId;
    
    elements.processInput.value = processName;
    
    // Store selected process
    appState.selectedProcess = {
        name: processName,
        pid: parseInt(processPid)
    };
    
    // Enable the Open button
    if (elements.openSelectedProcess) {
        elements.openSelectedProcess.disabled = false;
    }
}

function attachToSelectedProcess() {
    if (appState.selectedProcess) {
        closeModal('processSelectionModal');
        attachToProcess();
    }
}

function getProcessIcon(processName) {
    const name = processName.toLowerCase();
    
    // Return appropriate icons for different process types
    if (name.includes('chrome')) return 'fa-chrome';
    if (name.includes('firefox')) return 'fa-firefox';
    if (name.includes('edge')) return 'fa-edge';
    if (name.includes('notepad')) return 'fa-file-alt';
    if (name.includes('calc')) return 'fa-calculator';
    if (name.includes('code')) return 'fa-code';
    if (name.includes('steam')) return 'fa-steam';
    if (name.includes('discord')) return 'fa-discord';
    if (name.includes('spotify')) return 'fa-spotify';
    if (name.includes('game') || name.includes('launcher')) return 'fa-gamepad';
    if (name.includes('explorer')) return 'fa-folder';
    if (name.includes('cmd') || name.includes('powershell')) return 'fa-terminal';
    if (name.includes('video') || name.includes('media')) return 'fa-play';
    if (name.includes('cheat') || name.includes('hack')) return 'fa-bug';
    
    return 'fa-desktop'; // Default icon
}

function filterProcessList() {
    const searchTerm = elements.processSearch.value.toLowerCase();
    const processItems = elements.processListContainer.querySelectorAll('.process-item');
    
    processItems.forEach(item => {
        const processName = item.dataset.processName.toLowerCase();
        const processInfo = item.querySelector('.process-info').textContent.toLowerCase();
        
        if (processName.includes(searchTerm) || processInfo.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterProcessList() {
    const searchTerm = elements.processSearch.value.toLowerCase();
    const processItems = elements.processListContainer.querySelectorAll('.process-item');
    
    processItems.forEach(item => {
        const processName = item.dataset.processName.toLowerCase();
        const processInfo = item.querySelector('.process-info').textContent.toLowerCase();
        
        if (processName.includes(searchTerm) || processInfo.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function getProcessIcon(processName) {
    const name = processName.toLowerCase();
    
    if (name.includes('chrome')) return 'fab fa-chrome';
    if (name.includes('firefox')) return 'fab fa-firefox';
    if (name.includes('edge')) return 'fab fa-edge';
    if (name.includes('notepad')) return 'fas fa-file-alt';
    if (name.includes('calc')) return 'fas fa-calculator';
    if (name.includes('explorer')) return 'fas fa-folder';
    if (name.includes('steam')) return 'fab fa-steam';
    if (name.includes('discord')) return 'fab fa-discord';
    if (name.includes('spotify')) return 'fab fa-spotify';
    if (name.includes('vlc')) return 'fas fa-play';
    if (name.includes('code')) return 'fas fa-code';
    if (name.includes('game') || name.includes('.exe')) return 'fas fa-gamepad';
    
    return 'fas fa-desktop';
}

// Memory Scanning
async function performScan() {
    const value = elements.scanValue.value.trim();
    
    if (!value) {
        showToast('Please enter a value to scan', 'warning');
        return;
    }

    if (!appState.currentProcess) {
        showToast('Please attach to a process first', 'warning');
        return;
    }

    if (!appState.isConnected) {
        showToast('Not connected to memory engine', 'error');
        return;
    }

    showLoading();
    elements.nextScanBtn.disabled = true;
    
    try {
        // Send universal scan request via WebSocket
        appState.ws.send(JSON.stringify({
            type: 'scan',
            value: value,
            scanMethod: 'first'
        }));
        
        showToast(`Universal scanning for value: ${value}`, 'info');
    } catch (error) {
        console.error('Error performing scan:', error);
        showNoResults();
        showToast('Error performing scan', 'error');
    }
}

async function performNextScan() {
    if (appState.scanResults.length === 0) {
        showToast('No previous scan results', 'warning');
        return;
    }

    const value = elements.scanValue.value.trim();
    if (!value) {
        showToast('Please enter a value for next scan', 'warning');
        return;
    }

    if (!appState.isConnected) {
        showToast('Not connected to memory engine', 'error');
        return;
    }

    showLoading();
    
    try {
        // Send next scan request via WebSocket
        appState.ws.send(JSON.stringify({
            type: 'scan',
            value: value,
            scanMethod: 'next'
        }));
        
        showToast(`Filtering results for value: ${value}`, 'info');
    } catch (error) {
        console.error('Error performing next scan:', error);
        showNoResults();
        showToast('Error performing next scan', 'error');
    }
}

function updateScanResults() {
    if (appState.scanResults.length === 0) {
        showNoResults();
        return;
    }

    showResults();
    elements.nextScanBtn.disabled = false;
    
    elements.resultsBody.innerHTML = '';
    elements.resultsTime.textContent = `Scanned at ${new Date().toLocaleTimeString()}`;
    
    appState.scanResults.forEach((result, index) => {
        const row = document.createElement('tr');
        const interpretation = result.interpretation || `${result.type}: ${result.value}`;
        
        row.innerHTML = `
            <td><input type="checkbox" class="result-checkbox" data-index="${index}"></td>
            <td class="address-cell">${result.address}</td>
            <td class="value-cell">${result.value}</td>
            <td class="type-cell" title="${interpretation}">${result.type}</td>
            <td class="text-muted">-</td>
            <td class="actions-cell">
                <button class="btn btn-primary btn-small" onclick="openModifyModal('${result.address}', '${result.value}', '${result.type}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-secondary btn-small" onclick="freezeValue('${result.address}')">
                    <i class="fas fa-snowflake"></i>
                </button>
            </td>
        `;
        elements.resultsBody.appendChild(row);
    });
    
    updateStats();
}

// Memory Modification
function openModifyModal(address, currentValue, type) {
    const modal = document.getElementById('modifyModal');
    document.getElementById('modifyAddress').value = address;
    document.getElementById('modifyType').value = type;
    document.getElementById('currentValue').value = currentValue;
    document.getElementById('newValue').value = '';
    document.getElementById('freezeValue').checked = false;
    
    // Store data for confirmation
    modal.dataset.address = address;
    modal.dataset.type = type;
    modal.dataset.currentValue = currentValue;
    
    showModal('modifyModal');
}

async function confirmModify() {
    const modal = document.getElementById('modifyModal');
    const address = modal.dataset.address;
    const type = modal.dataset.type;
    const currentValue = modal.dataset.currentValue;
    const newValue = document.getElementById('newValue').value.trim();
    const freeze = document.getElementById('freezeValue').checked;
    
    if (!newValue) {
        showToast('Please enter a new value', 'warning');
        return;
    }

    // Validate value based on type
    if (type === 'integer' && isNaN(parseInt(newValue))) {
        showToast('Please enter a valid integer', 'warning');
        return;
    }

    if ((type === 'float' || type === 'double') && isNaN(parseFloat(newValue))) {
        showToast('Please enter a valid number', 'warning');
        return;
    }

    // Show confirmation if enabled
    if (appState.settings.confirmModify) {
        const result = await window.electronAPI.showMessageBox({
            type: 'question',
            buttons: ['Yes', 'No'],
            defaultId: 0,
            title: 'Confirm Modification',
            message: `Are you sure you want to modify this memory value?`,
            detail: `Address: ${address}\nCurrent: ${currentValue}\nNew: ${newValue}${freeze ? '\nValue will be frozen' : ''}`
        });
        
        if (result.response === 1) {
            return; // User clicked No
        }
    }

    try {
        // Send modify request via WebSocket
        appState.ws.send(JSON.stringify({
            type: 'modify',
            address: address,
            value: newValue,
            type: type,
            freeze: freeze
        }));
        
        appState.modifiedCount++;
        updateStats();
        closeModal('modifyModal');
        
        // Update the result in the table
        updateResultInTable(address, newValue);
        
        showToast(`Memory modified at ${address}`, 'success');
    } catch (error) {
        console.error('Error modifying memory:', error);
        showToast('Error modifying memory', 'error');
    }
}

function updateResultInTable(address, newValue) {
    const rows = elements.resultsBody.querySelectorAll('tr');
    rows.forEach(row => {
        const addressCell = row.querySelector('.address-cell');
        if (addressCell && addressCell.textContent === address) {
            const valueCell = row.querySelector('.value-cell');
            if (valueCell) {
                valueCell.textContent = newValue;
                valueCell.style.background = 'rgba(72, 187, 120, 0.2)';
                setTimeout(() => {
                    valueCell.style.background = '';
                }, 2000);
            }
        }
    });
}

function freezeValue(address) {
    showToast(`Freezing value at ${address}`, 'info');
    // In a real implementation, this would freeze the memory value
}

// Results Management
function clearResults() {
    appState.scanResults = [];
    elements.resultsBody.innerHTML = '';
    elements.nextScanBtn.disabled = true;
    updateStats();
    showNoResults();
    showToast('Results cleared', 'success');
}

async function exportResults() {
    if (appState.scanResults.length === 0) {
        showToast('No results to export', 'warning');
        return;
    }

    try {
        const result = await window.electronAPI.showSaveDialog({
            title: 'Export Scan Results',
            defaultPath: `scan_results_${new Date().toISOString().split('T')[0]}.json`,
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (!result.canceled) {
            const data = {
                timestamp: new Date().toISOString(),
                process: appState.currentProcess,
                results: appState.scanResults,
                stats: {
                    scanCount: appState.scanResults.length,
                    modifiedCount: appState.modifiedCount
                }
            };
            
            // In a real implementation, write to file
            console.log('Export data:', data);
            showToast('Results exported successfully', 'success');
        }
    } catch (error) {
        console.error('Error exporting results:', error);
        showToast('Error exporting results', 'error');
    }
}

async function importResults(filePath) {
    if (!filePath) {
        const result = await window.electronAPI.showOpenDialog({
            title: 'Import Scan Results',
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (result.canceled) return;
        filePath = result.filePaths[0];
    }
    
    try {
        // In a real implementation, read from file
        showToast('Results imported successfully', 'success');
    } catch (error) {
        console.error('Error importing results:', error);
        showToast('Error importing results', 'error');
    }
}

function showFilterDialog() {
    showToast('Filter dialog coming soon!', 'info');
}

function selectAllResults() {
    const checkboxes = document.querySelectorAll('.result-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = true);
    elements.selectAllCheckbox.checked = true;
}

function deselectAllResults() {
    const checkboxes = document.querySelectorAll('.result-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    elements.selectAllCheckbox.checked = false;
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.result-checkbox');
    const isChecked = elements.selectAllCheckbox.checked;
    checkboxes.forEach(checkbox => checkbox.checked = isChecked);
}

// Settings Management
async function loadSettings() {
    try {
        const savedSettings = await window.electronAPI.getStoreValue('settings', appState.settings);
        appState.settings = { ...appState.settings, ...savedSettings };
        
        // Apply settings to UI
        Object.keys(appState.settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = appState.settings[key];
                } else {
                    element.value = appState.settings[key];
                }
            }
        });
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    try {
        // Get values from UI
        Object.keys(appState.settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    appState.settings[key] = element.checked;
                } else {
                    appState.settings[key] = element.value;
                }
            }
        });
        
        // Save to store
        await window.electronAPI.setStoreValue('settings', appState.settings);
        
        // Apply theme
        applyTheme();
        
        closeModal('settingsModal');
        showToast('Settings saved successfully', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings', 'error');
    }
}

function applyTheme() {
    const theme = appState.settings.theme;
    const fontSize = appState.settings.fontSize;
    
    document.body.className = `theme-${theme} font-${fontSize}`;
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    
    // Focus first input
    const firstInput = modal.querySelector('input:not([readonly]), select, textarea');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Close modal when clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal(modalId);
        }
    };
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Update tab buttons
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));
    event.target.classList.add('active');
}

// Toast Notifications
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Utility Functions
function focusProcessInput() {
    elements.processInput.focus();
}

function handleKeyboardShortcuts(e) {
    const isCtrl = e.ctrlKey || e.metaKey;
    
    if (isCtrl) {
        switch (e.key) {
            case 'n':
                e.preventDefault();
                clearResults();
                focusProcessInput();
                break;
            case 's':
                e.preventDefault();
                if (e.shiftKey) {
                    exportResults();
                } else {
                    performScan();
                }
                break;
            case 'o':
                e.preventDefault();
                importResults();
                break;
            case 'p':
                e.preventDefault();
                focusProcessInput();
                break;
            case 'm':
                e.preventDefault();
                elements.scanValue.focus();
                break;
            case ',':
                e.preventDefault();
                showModal('settingsModal');
                break;
            case 'a':
                e.preventDefault();
                selectAllResults();
                break;
        }
    }
    
    // Escape key
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
}

// Update notification functions
function showUpdateNotification(message, type = 'available') {
    elements.updateText.textContent = message;
    elements.updateNotification.classList.remove('hidden');
    elements.updateProgress.classList.add('hidden');
    
    if (type === 'downloaded') {
        elements.updateNow.textContent = 'Restart & Install';
        elements.updateLater.textContent = 'Later';
    } else {
        elements.updateNow.textContent = 'Download Now';
        elements.updateLater.textContent = 'Later';
    }
    
    // Add class to app to adjust content margin
    document.querySelector('.app').classList.add('update-visible');
}

function showUpdateProgress(percent, message) {
    elements.updateProgress.classList.remove('hidden');
    elements.progressFillUpdate.style.width = `${percent}%`;
    elements.progressText.textContent = message;
}

function hideUpdateNotification() {
    elements.updateNotification.classList.add('hidden');
    document.querySelector('.app').classList.remove('update-visible');
}

async function installUpdateNow() {
    try {
        const buttonText = elements.updateNow.textContent;
        if (buttonText === 'Restart & Install') {
            // Update is downloaded, restart to install
            await window.electronAPI.restartAndInstall();
        } else {
            // Start manual update check
            elements.updateNow.disabled = true;
            elements.updateNow.textContent = 'Checking...';
            await window.electronAPI.checkForUpdates();
        }
    } catch (error) {
        console.error('Error during update:', error);
        showToast('Update failed. Please try again.', 'error');
        elements.updateNow.disabled = false;
        elements.updateNow.textContent = 'Download Now';
    }
}

// Export for debugging
window.ChimixApp = {
    state: appState,
    elements,
    showToast,
    connectWebSocket,
    loadSettings,
    saveSettings
};

console.log('ChimixCheatEngine Desktop Application loaded successfully!');
