#include "ProcessManager.h"

ProcessManager::ProcessManager() : processHandle(nullptr), processId(0) {}

ProcessManager::~ProcessManager() {
    CloseProcess();
}

ScannerError ProcessManager::FindProcess(const std::wstring& name) {
    processName = name;
    DWORD pid = GetProcessID(name);
    
    if (pid == 0) {
        return ScannerError::ProcessNotFound;
    }
    
    return OpenTargetProcess(pid);
}

DWORD ProcessManager::GetProcessID(const std::wstring& processName) {
    PROCESSENTRY32W pe32 = { sizeof(PROCESSENTRY32W) };
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    DWORD pid = 0;

    if (snapshot == INVALID_HANDLE_VALUE) {
        return 0;
    }

    if (Process32FirstW(snapshot, &pe32)) {
        do {
            if (wcscmp(pe32.szExeFile, processName.c_str()) == 0) {
                pid = pe32.th32ProcessID;
                break;
            }
        } while (Process32NextW(snapshot, &pe32));
    }

    CloseHandle(snapshot);
    return pid;
}

std::wstring ProcessManager::GetWindowTitle(DWORD processId) {
    std::wstring title;
    
    // Structure to pass data to EnumWindows callback
    struct EnumData {
        DWORD processId;
        std::wstring title;
    } enumData = { processId, L"" };
    
    // Enumerate all windows and find one belonging to our process
    EnumWindows([](HWND hwnd, LPARAM lParam) -> BOOL {
        EnumData* data = reinterpret_cast<EnumData*>(lParam);
        DWORD windowProcessId;
        GetWindowThreadProcessId(hwnd, &windowProcessId);
        
        if (windowProcessId == data->processId && IsWindowVisible(hwnd)) {
            wchar_t title[256];
            if (GetWindowTextW(hwnd, title, sizeof(title) / sizeof(wchar_t)) > 0) {
                data->title = title;
                return FALSE; // Stop enumeration
            }
        }
        return TRUE; // Continue enumeration
    }, reinterpret_cast<LPARAM>(&enumData));
    
    return enumData.title;
}

std::vector<ProcessInfo> ProcessManager::GetAllProcesses() {
    std::vector<ProcessInfo> processes;
    PROCESSENTRY32W pe32 = { sizeof(PROCESSENTRY32W) };
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

    if (snapshot == INVALID_HANDLE_VALUE) {
        return processes;
    }

    if (Process32FirstW(snapshot, &pe32)) {
        do {
            // Skip system processes and processes without meaningful names
            if (pe32.th32ProcessID > 4 && wcslen(pe32.szExeFile) > 0) {
                std::wstring processName = pe32.szExeFile;
                // Get window title if available
                std::wstring windowTitle = GetWindowTitle(pe32.th32ProcessID);
                processes.emplace_back(pe32.th32ProcessID, processName, windowTitle);
            }
        } while (Process32NextW(snapshot, &pe32));
    }

    CloseHandle(snapshot);
    
    // Sort processes by name for better user experience
    std::sort(processes.begin(), processes.end(), 
        [](const ProcessInfo& a, const ProcessInfo& b) {
            return a.processName < b.processName;
        });
    
    return processes;
}

ScannerError ProcessManager::OpenTargetProcess(DWORD pid) {
    processId = pid;
    processHandle = OpenProcess(
        PROCESS_VM_READ | PROCESS_VM_WRITE | PROCESS_VM_OPERATION | PROCESS_QUERY_INFORMATION,
        FALSE,
        pid
    );

    if (!processHandle) {
        DWORD error = GetLastError();
        if (error == ERROR_ACCESS_DENIED) {
            return ScannerError::AccessDenied;
        }
        return ScannerError::ProcessNotFound;
    }

    return ScannerError::Success;
}

bool ProcessManager::IsProcessRunning() {
    if (!processHandle) return false;
    
    DWORD exitCode;
    if (GetExitCodeProcess(processHandle, &exitCode)) {
        return exitCode == STILL_ACTIVE;
    }
    return false;
}

void ProcessManager::CloseProcess() {
    SAFE_CLOSE_HANDLE(processHandle);
    processId = 0;
    processName.clear();
}
