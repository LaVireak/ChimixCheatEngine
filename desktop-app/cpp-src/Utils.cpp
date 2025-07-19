#include "../include/Common.h"
#include "Utils.h"

// Convert ScannerError to string
std::string ErrorToString(ScannerError error) {
    switch (error) {
        case ScannerError::Success:
            return "Success";
        case ScannerError::ProcessNotFound:
            return "Process not found";
        case ScannerError::AccessDenied:
            return "Access denied - try running as administrator";
        case ScannerError::InvalidAddress:
            return "Invalid memory address";
        case ScannerError::ReadError:
            return "Failed to read memory";
        case ScannerError::WriteError:
            return "Failed to write memory";
        default:
            return "Unknown error";
    }
}

// Print error message
void PrintError(ScannerError error) {
    std::cout << "Error: " << ErrorToString(error) << std::endl;
}

// Print success message
void PrintSuccess(const std::string& message) {
    std::cout << "Success: " << message << std::endl;
}

// Get user input as integer
int GetIntInput(const std::string& prompt) {
    int value;
    std::cout << prompt;
    std::cin >> value;
    return value;
}

// Get user input as string
std::string GetStringInput(const std::string& prompt) {
    std::string input;
    std::cout << prompt;
    std::cin >> input;
    return input;
}

// Convert hex string to address
LPVOID HexStringToAddress(const std::string& hexStr) {
    try {
        unsigned long long address = std::stoull(hexStr, nullptr, 16);
        return (LPVOID)address;
    }
    catch (...) {
        return nullptr;
    }
}

// Print separator line
void PrintSeparator() {
    std::cout << "============================================" << std::endl;
}
