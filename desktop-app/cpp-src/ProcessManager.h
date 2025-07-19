#pragma once

#include "../include/Common.h"

class ProcessManager {
private:
    HANDLE processHandle;
    DWORD processId;
    std::wstring processName;
    
    // Helper method to get window title for a process
    std::wstring GetWindowTitle(DWORD processId);

public:
    ProcessManager();
    ~ProcessManager();

    // Find process by name
    ScannerError FindProcess(const std::wstring& processName);
    
    // Get process ID by name
    DWORD GetProcessID(const std::wstring& processName);
    
    // Get all running processes
    std::vector<ProcessInfo> GetAllProcesses();
    
    // Open process with required permissions
    ScannerError OpenTargetProcess(DWORD pid);
    
    // Check if process is still running
    bool IsProcessRunning();
    
    // Get process handle
    HANDLE GetProcessHandle() const { return processHandle; }
    
    // Get process ID
    DWORD GetProcessId() const { return processId; }
    
    // Get process name
    std::wstring GetProcessName() const { return processName; }
    
    // Close process handle
    void CloseProcess();
};
