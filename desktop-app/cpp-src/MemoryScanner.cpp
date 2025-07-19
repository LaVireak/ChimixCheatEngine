#include "MemoryScanner.h"
#include <cmath>

MemoryScanner::MemoryScanner(HANDLE hProcess) : processHandle(hProcess) {}

MemoryScanner::~MemoryScanner() {
    ClearResults();
}

bool MemoryScanner::IsValidMemoryRegion(const MEMORY_BASIC_INFORMATION& mbi) {
    // Check if memory is committed and readable
    if (mbi.State != MEM_COMMIT) return false;
    
    // Check if memory is readable/writable
    if (!(mbi.Protect & VALID_MEMORY_PROTECTION)) return false;
    
    // Skip guard pages and no-access pages
    if (mbi.Protect & (PAGE_GUARD | PAGE_NOACCESS)) return false;
    
    return true;
}

void MemoryScanner::ScanMemoryRegion(BYTE* baseAddress, SIZE_T regionSize, int targetValue) {
    BYTE* buffer = new BYTE[regionSize];
    SIZE_T bytesRead;

    if (ReadProcessMemory(processHandle, baseAddress, buffer, regionSize, &bytesRead)) {
        // Scan buffer for target value (aligned to 4-byte integers)
        for (SIZE_T i = 0; i <= bytesRead - sizeof(int); i += sizeof(int)) {
            int* valuePtr = (int*)&buffer[i];
            if (*valuePtr == targetValue) {
                LPVOID address = (LPVOID)(baseAddress + i);
                scanResults.emplace_back(address, targetValue);
                
                // Limit results to prevent memory issues
                if (scanResults.size() >= MAX_RESULTS) {
                    delete[] buffer;
                    return;
                }
            }
        }
    }

    delete[] buffer;
}

void MemoryScanner::ScanMemoryRegionFloat(BYTE* baseAddress, SIZE_T regionSize, float targetValue) {
    BYTE* buffer = new BYTE[regionSize];
    SIZE_T bytesRead;

    if (ReadProcessMemory(processHandle, baseAddress, buffer, regionSize, &bytesRead)) {
        // Scan buffer for target float value (aligned to 4-byte floats)
        for (SIZE_T i = 0; i <= bytesRead - sizeof(float); i += sizeof(float)) {
            float* valuePtr = (float*)&buffer[i];
            if (fabs(*valuePtr - targetValue) < FLOAT_EPSILON) {
                LPVOID address = (LPVOID)(baseAddress + i);
                floatScanResults.emplace_back(address, targetValue);
                
                // Limit results to prevent memory issues
                if (floatScanResults.size() >= MAX_RESULTS) {
                    delete[] buffer;
                    return;
                }
            }
        }
    }

    delete[] buffer;
}

void MemoryScanner::ScanMemoryRegionPointer(BYTE* baseAddress, SIZE_T regionSize, uintptr_t targetAddress) {
    BYTE* buffer = new BYTE[regionSize];
    SIZE_T bytesRead;

    if (ReadProcessMemory(processHandle, baseAddress, buffer, regionSize, &bytesRead)) {
        // Scan buffer for pointers to target address (aligned to pointer size)
        for (SIZE_T i = 0; i <= bytesRead - sizeof(uintptr_t); i += sizeof(uintptr_t)) {
            uintptr_t* valuePtr = (uintptr_t*)&buffer[i];
            if (*valuePtr == targetAddress) {
                LPVOID address = (LPVOID)(baseAddress + i);
                pointerScanResults.emplace_back(address, (LPVOID)targetAddress);
                
                // Limit results to prevent memory issues
                if (pointerScanResults.size() >= MAX_RESULTS) {
                    delete[] buffer;
                    return;
                }
            }
        }
    }

    delete[] buffer;
}

ScannerError MemoryScanner::ScanForValue(int targetValue) {
    ClearResults();
    
    SYSTEM_INFO si;
    GetSystemInfo(&si);

    MEMORY_BASIC_INFORMATION mbi;
    BYTE* address = (BYTE*)si.lpMinimumApplicationAddress;

    std::wcout << L"Scanning memory for value: " << targetValue << L"..." << std::endl;

    while (address < si.lpMaximumApplicationAddress) {
        if (VirtualQueryEx(processHandle, address, &mbi, sizeof(mbi))) {
            if (IsValidMemoryRegion(mbi)) {
                ScanMemoryRegion(address, mbi.RegionSize, targetValue);
                
                // Stop if we've found enough results
                if (scanResults.size() >= MAX_RESULTS) {
                    std::wcout << L"Maximum results reached (" << MAX_RESULTS << L"). Stopping scan." << std::endl;
                    break;
                }
            }
            address += mbi.RegionSize;
        }
        else {
            break;
        }
    }

    std::wcout << L"Scan complete. Found " << scanResults.size() << L" results." << std::endl;
    return ScannerError::Success;
}

ScannerError MemoryScanner::ScanForFloatValue(float targetValue) {
    floatScanResults.clear();
    
    SYSTEM_INFO si;
    GetSystemInfo(&si);

    MEMORY_BASIC_INFORMATION mbi;
    BYTE* address = (BYTE*)si.lpMinimumApplicationAddress;

    std::wcout << L"Scanning memory for float value: " << targetValue << L"..." << std::endl;

    while (address < si.lpMaximumApplicationAddress) {
        if (VirtualQueryEx(processHandle, address, &mbi, sizeof(mbi))) {
            if (IsValidMemoryRegion(mbi)) {
                ScanMemoryRegionFloat(address, mbi.RegionSize, targetValue);
                
                // Stop if we've found enough results
                if (floatScanResults.size() >= MAX_RESULTS) {
                    std::wcout << L"Maximum results reached (" << MAX_RESULTS << L"). Stopping scan." << std::endl;
                    break;
                }
            }
            address += mbi.RegionSize;
        }
        else {
            break;
        }
    }

    std::wcout << L"Float scan complete. Found " << floatScanResults.size() << L" results." << std::endl;
    return ScannerError::Success;
}

ScannerError MemoryScanner::ScanForPointer(uintptr_t targetAddress) {
    pointerScanResults.clear();
    
    SYSTEM_INFO si;
    GetSystemInfo(&si);

    MEMORY_BASIC_INFORMATION mbi;
    BYTE* address = (BYTE*)si.lpMinimumApplicationAddress;

    std::wcout << L"Scanning memory for pointers to address: 0x" << std::hex << targetAddress << std::dec << L"..." << std::endl;

    while (address < si.lpMaximumApplicationAddress) {
        if (VirtualQueryEx(processHandle, address, &mbi, sizeof(mbi))) {
            if (IsValidMemoryRegion(mbi)) {
                ScanMemoryRegionPointer(address, mbi.RegionSize, targetAddress);
                
                // Stop if we've found enough results
                if (pointerScanResults.size() >= MAX_RESULTS) {
                    std::wcout << L"Maximum results reached (" << MAX_RESULTS << L"). Stopping scan." << std::endl;
                    break;
                }
            }
            address += mbi.RegionSize;
        }
        else {
            break;
        }
    }

    std::wcout << L"Pointer scan complete. Found " << pointerScanResults.size() << L" results." << std::endl;
    return ScannerError::Success;
}

ScannerError MemoryScanner::ScanMemoryRange(LPVOID startAddress, SIZE_T size, int targetValue) {
    ClearResults();
    
    MEMORY_BASIC_INFORMATION mbi;
    BYTE* address = (BYTE*)startAddress;
    BYTE* endAddress = address + size;

    while (address < endAddress) {
        if (VirtualQueryEx(processHandle, address, &mbi, sizeof(mbi))) {
            if (IsValidMemoryRegion(mbi)) {
                SIZE_T scanSize = std::min(mbi.RegionSize, (SIZE_T)(endAddress - address));
                ScanMemoryRegion(address, scanSize, targetValue);
            }
            address += mbi.RegionSize;
        }
        else {
            break;
        }
    }

    return ScannerError::Success;
}

ScannerError MemoryScanner::ReadMemoryValue(LPVOID address, int& value) {
    SIZE_T bytesRead;
    if (ReadProcessMemory(processHandle, address, &value, sizeof(value), &bytesRead)) {
        return ScannerError::Success;
    }
    return ScannerError::ReadError;
}

ScannerError MemoryScanner::ReadFloatMemoryValue(LPVOID address, float& value) {
    SIZE_T bytesRead;
    if (ReadProcessMemory(processHandle, address, &value, sizeof(value), &bytesRead)) {
        return ScannerError::Success;
    }
    return ScannerError::ReadError;
}

ScannerError MemoryScanner::WriteMemoryValue(LPVOID address, int newValue) {
    SIZE_T bytesWritten;
    if (WriteProcessMemory(processHandle, address, &newValue, sizeof(newValue), &bytesWritten)) {
        return ScannerError::Success;
    }
    return ScannerError::WriteError;
}

ScannerError MemoryScanner::WriteFloatMemoryValue(LPVOID address, float newValue) {
    SIZE_T bytesWritten;
    if (WriteProcessMemory(processHandle, address, &newValue, sizeof(newValue), &bytesWritten)) {
        return ScannerError::Success;
    }
    return ScannerError::WriteError;
}

void MemoryScanner::ClearResults() {
    scanResults.clear();
    floatScanResults.clear();
    pointerScanResults.clear();
}

void MemoryScanner::PrintResults() {
    std::wcout << L"\n=== Integer Scan Results ===" << std::endl;
    std::wcout << L"Found " << scanResults.size() << L" matches:" << std::endl;
    
    for (size_t i = 0; i < scanResults.size(); ++i) {
        std::wcout << L"[" << i << L"] Address: 0x" << std::hex << scanResults[i].address 
                   << L" Value: " << std::dec << scanResults[i].value << std::endl;
        
        // Limit output to prevent console spam
        if (i >= 50) {
            std::wcout << L"... and " << (scanResults.size() - i - 1) << L" more results." << std::endl;
            break;
        }
    }
    std::wcout << L"=============================" << std::endl;
}

void MemoryScanner::PrintFloatResults() {
    std::wcout << L"\n=== Float Scan Results ===" << std::endl;
    std::wcout << L"Found " << floatScanResults.size() << L" matches:" << std::endl;
    
    for (size_t i = 0; i < floatScanResults.size(); ++i) {
        std::wcout << L"[" << i << L"] Address: 0x" << std::hex << floatScanResults[i].address 
                   << L" Value: " << std::dec << floatScanResults[i].value << std::endl;
        
        // Limit output to prevent console spam
        if (i >= 50) {
            std::wcout << L"... and " << (floatScanResults.size() - i - 1) << L" more results." << std::endl;
            break;
        }
    }
    std::wcout << L"============================" << std::endl;
}

void MemoryScanner::PrintPointerResults() {
    std::wcout << L"\n=== Pointer Scan Results ===" << std::endl;
    std::wcout << L"Found " << pointerScanResults.size() << L" matches:" << std::endl;
    
    for (size_t i = 0; i < pointerScanResults.size(); ++i) {
        std::wcout << L"[" << i << L"] Pointer Address: 0x" << std::hex << pointerScanResults[i].pointerAddress 
                   << L" -> Target Address: 0x" << pointerScanResults[i].targetAddress << std::dec << std::endl;
        
        // Limit output to prevent console spam
        if (i >= 50) {
            std::wcout << L"... and " << (pointerScanResults.size() - i - 1) << L" more results." << std::endl;
            break;
        }
    }
    std::wcout << L"==============================" << std::endl;
}
