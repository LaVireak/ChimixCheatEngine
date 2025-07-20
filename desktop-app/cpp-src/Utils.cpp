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

// Simple file logger for debugging engine startup and errors
#include <fstream>
#include <ctime>
#include <windows.h>
#include <shlobj.h>
#include <sys/stat.h>
void LogToFile(const std::string& message) {
    // Get %LOCALAPPDATA%\ChimixCheatEngine\engine.log
    char appDataPath[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, appDataPath))) {
        std::string logDir = std::string(appDataPath) + "\\ChimixCheatEngine";
        // Create directory if it doesn't exist
        CreateDirectoryA(logDir.c_str(), NULL);
        std::string logPath = logDir + "\\engine.log";
        std::ofstream log(logPath, std::ios::app);
        if (log.is_open()) {
            // Timestamp
            std::time_t now = std::time(nullptr);
            char buf[32];
            std::strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", std::localtime(&now));
            log << "[" << buf << "] " << message << std::endl;
            log.close();
        }
    }
}
