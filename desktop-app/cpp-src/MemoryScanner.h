#pragma once

#include "../include/Common.h"

class MemoryScanner {
private:
    HANDLE processHandle;
    std::vector<MemoryResult> scanResults;
    std::vector<FloatMemoryResult> floatScanResults;
    std::vector<PointerResult> pointerScanResults;
    
    // Helper function to check if memory region is valid for scanning
    bool IsValidMemoryRegion(const MEMORY_BASIC_INFORMATION& mbi);
    
    // Scan a specific memory region for a value
    void ScanMemoryRegion(BYTE* baseAddress, SIZE_T regionSize, int targetValue);
    
    // Scan a specific memory region for a float value
    void ScanMemoryRegionFloat(BYTE* baseAddress, SIZE_T regionSize, float targetValue);
    
    // Scan a specific memory region for pointers
    void ScanMemoryRegionPointer(BYTE* baseAddress, SIZE_T regionSize, uintptr_t targetAddress);

public:
    MemoryScanner(HANDLE hProcess);
    ~MemoryScanner();

    // Scan entire process memory for a specific integer value
    ScannerError ScanForValue(int targetValue);
    
    // Scan entire process memory for a specific float value
    ScannerError ScanForFloatValue(float targetValue);
    
    // Scan for pointers pointing to a specific address
    ScannerError ScanForPointer(uintptr_t targetAddress);
    
    // Scan specific memory range
    ScannerError ScanMemoryRange(LPVOID startAddress, SIZE_T size, int targetValue);
    
    // Read memory value from specific address
    ScannerError ReadMemoryValue(LPVOID address, int& value);
    
    // Read float memory value from specific address
    ScannerError ReadFloatMemoryValue(LPVOID address, float& value);
    
    // Write new value to memory address
    ScannerError WriteMemoryValue(LPVOID address, int newValue);
    
    // Write new float value to memory address
    ScannerError WriteFloatMemoryValue(LPVOID address, float newValue);
    
    // Get scan results
    const std::vector<MemoryResult>& GetResults() const { return scanResults; }
    
    // Get float scan results
    const std::vector<FloatMemoryResult>& GetFloatResults() const { return floatScanResults; }
    
    // Get pointer scan results
    const std::vector<PointerResult>& GetPointerResults() const { return pointerScanResults; }
    
    // Clear previous scan results
    void ClearResults();
    
    // Get number of results found
    size_t GetResultCount() const { return scanResults.size(); }
    
    // Get number of float results found
    size_t GetFloatResultCount() const { return floatScanResults.size(); }
    
    // Get number of pointer results found
    size_t GetPointerResultCount() const { return pointerScanResults.size(); }
    
    // Print all results to console
    void PrintResults();
    
    // Print float results to console
    void PrintFloatResults();
    
    // Print pointer results to console
    void PrintPointerResults();
};
