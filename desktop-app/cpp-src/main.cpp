#include "../include/Common.h"
#include "ProcessManager.h"
#include "MemoryScanner.h"
#include "Utils.h"

void PrintMenu() {
    std::cout << "\n=== ChimixCheatEngine - Memory Scanner ===" << std::endl;
    std::cout << "1. Attach to process" << std::endl;
    std::cout << "2. Scan for integer value" << std::endl;
    std::cout << "3. Scan for float value" << std::endl;
    std::cout << "4. Scan for pointers" << std::endl;
    std::cout << "5. View integer scan results" << std::endl;
    std::cout << "6. View float scan results" << std::endl;
    std::cout << "7. View pointer scan results" << std::endl;
    std::cout << "8. Modify integer memory value" << std::endl;
    std::cout << "9. Modify float memory value" << std::endl;
    std::cout << "10. Read memory address" << std::endl;
    std::cout << "0. Exit" << std::endl;
    std::cout << "Choice: ";
}

void AttachToProcess(ProcessManager& procManager) {
    std::cout << "\nEnter process name (e.g., notepad.exe): ";
    std::string processName = GetStringInput("");
    
    std::cout << "Searching for process: " << processName << std::endl;
    
    // Convert string to wstring for ProcessManager
    std::wstring wprocessName(processName.begin(), processName.end());
    
    ScannerError result = procManager.FindProcess(wprocessName);
    if (result == ScannerError::Success) {
        PrintSuccess("Successfully attached to process!");
        std::cout << "Process ID: " << procManager.GetProcessId() << std::endl;
    } else {
        PrintError(result);
    }
}

void ScanForValue(ProcessManager& procManager, MemoryScanner& scanner) {
    if (!procManager.GetProcessHandle()) {
        std::cout << "No process attached. Please attach to a process first." << std::endl;
        return;
    }
    
    if (!procManager.IsProcessRunning()) {
        std::cout << "Target process is no longer running." << std::endl;
        return;
    }
    
    int targetValue = GetIntInput("Enter integer value to scan for: ");
    
    std::cout << "Starting memory scan..." << std::endl;
    ScannerError result = scanner.ScanForValue(targetValue);
    
    if (result == ScannerError::Success) {
        PrintSuccess("Memory scan completed!");
        std::cout << "Found " << scanner.GetResultCount() << " matches." << std::endl;
    } else {
        PrintError(result);
    }
}

void ScanForFloatValue(ProcessManager& procManager, MemoryScanner& scanner) {
    if (!procManager.GetProcessHandle()) {
        std::cout << "No process attached. Please attach to a process first." << std::endl;
        return;
    }
    
    if (!procManager.IsProcessRunning()) {
        std::cout << "Target process is no longer running." << std::endl;
        return;
    }
    
    std::cout << "Enter float value to scan for (e.g., 100.5): ";
    float targetValue;
    std::cin >> targetValue;
    
    std::cout << "Starting float memory scan..." << std::endl;
    ScannerError result = scanner.ScanForFloatValue(targetValue);
    
    if (result == ScannerError::Success) {
        PrintSuccess("Float memory scan completed!");
        std::cout << "Found " << scanner.GetFloatResultCount() << " matches." << std::endl;
    } else {
        PrintError(result);
    }
}

void ScanForPointers(ProcessManager& procManager, MemoryScanner& scanner) {
    if (!procManager.GetProcessHandle()) {
        std::cout << "No process attached. Please attach to a process first." << std::endl;
        return;
    }
    
    if (!procManager.IsProcessRunning()) {
        std::cout << "Target process is no longer running." << std::endl;
        return;
    }
    
    std::cout << "Enter target address (hex, e.g., 0x12345678): ";
    std::string addressStr = GetStringInput("");
    
    LPVOID address = HexStringToAddress(addressStr);
    if (!address) {
        std::cout << "Invalid address format." << std::endl;
        return;
    }
    
    std::cout << "Starting pointer scan..." << std::endl;
    ScannerError result = scanner.ScanForPointer((uintptr_t)address);
    
    if (result == ScannerError::Success) {
        PrintSuccess("Pointer scan completed!");
        std::cout << "Found " << scanner.GetPointerResultCount() << " pointers." << std::endl;
    } else {
        PrintError(result);
    }
}

void ViewResults(MemoryScanner& scanner) {
    if (scanner.GetResultCount() == 0) {
        std::cout << "No integer scan results available. Run a scan first." << std::endl;
        return;
    }
    
    scanner.PrintResults();
}

void ViewFloatResults(MemoryScanner& scanner) {
    if (scanner.GetFloatResultCount() == 0) {
        std::cout << "No float scan results available. Run a float scan first." << std::endl;
        return;
    }
    
    scanner.PrintFloatResults();
}

void ViewPointerResults(MemoryScanner& scanner) {
    if (scanner.GetPointerResultCount() == 0) {
        std::cout << "No pointer scan results available. Run a pointer scan first." << std::endl;
        return;
    }
    
    scanner.PrintPointerResults();
}

void ModifyMemoryValue(ProcessManager& procManager, MemoryScanner& scanner) {
    if (!procManager.GetProcessHandle()) {
        std::cout << "No process attached. Please attach to a process first." << std::endl;
        return;
    }
    
    if (!procManager.IsProcessRunning()) {
        std::cout << "Target process is no longer running." << std::endl;
        return;
    }
    
    std::cout << "Enter memory address (hex, e.g., 0x12345678): ";
    std::string addressStr = GetStringInput("");
    
    LPVOID address = HexStringToAddress(addressStr);
    if (!address) {
        std::cout << "Invalid address format." << std::endl;
        return;
    }
    
    // First, try to read current value
    int currentValue;
    ScannerError readResult = scanner.ReadMemoryValue(address, currentValue);
    if (readResult == ScannerError::Success) {
        std::cout << "Current integer value at address: " << currentValue << std::endl;
    } else {
        std::cout << "Warning: Could not read current value." << std::endl;
    }
    
    int newValue = GetIntInput("Enter new integer value: ");
    
    ScannerError result = scanner.WriteMemoryValue(address, newValue);
    if (result == ScannerError::Success) {
        PrintSuccess("Memory value modified successfully!");
        
        // Verify the write
        int verifyValue;
        if (scanner.ReadMemoryValue(address, verifyValue) == ScannerError::Success) {
            std::cout << "Verified new value: " << verifyValue << std::endl;
        }
    } else {
        PrintError(result);
    }
}

void ModifyFloatMemoryValue(ProcessManager& procManager, MemoryScanner& scanner) {
    if (!procManager.GetProcessHandle()) {
        std::cout << "No process attached. Please attach to a process first." << std::endl;
        return;
    }
    
    if (!procManager.IsProcessRunning()) {
        std::cout << "Target process is no longer running." << std::endl;
        return;
    }
    
    std::cout << "Enter memory address (hex, e.g., 0x12345678): ";
    std::string addressStr = GetStringInput("");
    
    LPVOID address = HexStringToAddress(addressStr);
    if (!address) {
        std::cout << "Invalid address format." << std::endl;
        return;
    }
    
    // First, try to read current value
    float currentValue;
    ScannerError readResult = scanner.ReadFloatMemoryValue(address, currentValue);
    if (readResult == ScannerError::Success) {
        std::cout << "Current float value at address: " << currentValue << std::endl;
    } else {
        std::cout << "Warning: Could not read current value." << std::endl;
    }
    
    std::cout << "Enter new float value (e.g., 100.5): ";
    float newValue;
    std::cin >> newValue;
    
    ScannerError result = scanner.WriteFloatMemoryValue(address, newValue);
    if (result == ScannerError::Success) {
        PrintSuccess("Float memory value modified successfully!");
        
        // Verify the write
        float verifyValue;
        if (scanner.ReadFloatMemoryValue(address, verifyValue) == ScannerError::Success) {
            std::cout << "Verified new value: " << verifyValue << std::endl;
        }
    } else {
        PrintError(result);
    }
}

void ReadMemoryAddress(ProcessManager& procManager, MemoryScanner& scanner) {
    if (!procManager.GetProcessHandle()) {
        std::cout << "No process attached. Please attach to a process first." << std::endl;
        return;
    }
    
    if (!procManager.IsProcessRunning()) {
        std::cout << "Target process is no longer running." << std::endl;
        return;
    }
    
    std::cout << "Enter memory address (hex, e.g., 0x12345678): ";
    std::string addressStr = GetStringInput("");
    
    LPVOID address = HexStringToAddress(addressStr);
    if (!address) {
        std::cout << "Invalid address format." << std::endl;
        return;
    }
    
    int value;
    ScannerError result = scanner.ReadMemoryValue(address, value);
    if (result == ScannerError::Success) {
        std::cout << "Value at address 0x" << std::hex << address << ": " << std::dec << value << std::endl;
    } else {
        PrintError(result);
    }
}

int main() {
    // Set console to handle output properly
    SetConsoleOutputCP(CP_UTF8);
    
    std::cout << "ChimixCheatEngine - Simple Memory Scanner & Editor" << std::endl;
    std::cout << "For educational and offline use only!" << std::endl;
    PrintSeparator();
    
    ProcessManager procManager;
    MemoryScanner scanner(procManager.GetProcessHandle());
    
    int choice;
    do {
        PrintMenu();
        std::cin >> choice;
        
        switch (choice) {
            case 1:
                AttachToProcess(procManager);
                // Update scanner with new process handle
                scanner = MemoryScanner(procManager.GetProcessHandle());
                break;
            case 2:
                ScanForValue(procManager, scanner);
                break;
            case 3:
                ScanForFloatValue(procManager, scanner);
                break;
            case 4:
                ScanForPointers(procManager, scanner);
                break;
            case 5:
                ViewResults(scanner);
                break;
            case 6:
                ViewFloatResults(scanner);
                break;
            case 7:
                ViewPointerResults(scanner);
                break;
            case 8:
                ModifyMemoryValue(procManager, scanner);
                break;
            case 9:
                ModifyFloatMemoryValue(procManager, scanner);
                break;
            case 10:
                ReadMemoryAddress(procManager, scanner);
                break;
            case 0:
                std::cout << "Goodbye!" << std::endl;
                break;
            default:
                std::cout << "Invalid choice. Please try again." << std::endl;
        }
        
    } while (choice != 0);
    
    return 0;
}
