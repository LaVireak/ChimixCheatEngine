#pragma once

#include <windows.h>
#include <tlhelp32.h>
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <locale>

// Common constants
#define BUFFER_SIZE 4096
#define MAX_RESULTS 1000
#define FLOAT_EPSILON 0.0001f

// Memory protection flags we care about
#define VALID_MEMORY_PROTECTION (PAGE_READWRITE | PAGE_WRITECOPY | PAGE_EXECUTE_READWRITE)

// Structure to hold memory address results
struct MemoryResult {
    LPVOID address;
    int value;
    
    MemoryResult(LPVOID addr, int val) : address(addr), value(val) {}
};

// Structure to hold float memory address results
struct FloatMemoryResult {
    LPVOID address;
    float value;
    
    FloatMemoryResult(LPVOID addr, float val) : address(addr), value(val) {}
};

// Structure to hold pointer scan results
struct PointerResult {
    LPVOID pointerAddress;
    LPVOID targetAddress;
    
    PointerResult(LPVOID ptrAddr, LPVOID targetAddr) : pointerAddress(ptrAddr), targetAddress(targetAddr) {}
};

// Structure to hold process information
struct ProcessInfo {
    DWORD processId;
    std::wstring processName;
    std::wstring windowTitle;
    
    ProcessInfo(DWORD pid, const std::wstring& name, const std::wstring& title = L"") 
        : processId(pid), processName(name), windowTitle(title) {}
};

// Error codes
enum class ScannerError {
    Success = 0,
    ProcessNotFound,
    AccessDenied,
    InvalidAddress,
    ReadError,
    WriteError
};

// Utility macros
#define SAFE_CLOSE_HANDLE(h) if (h && h != INVALID_HANDLE_VALUE) { CloseHandle(h); h = nullptr; }
#define SAFE_DELETE_ARRAY(p) if (p) { delete[] p; p = nullptr; }
