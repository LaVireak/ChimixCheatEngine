#pragma once

#include "../include/Common.h"

// Convert ScannerError to string
std::string ErrorToString(ScannerError error);

// Print error message
void PrintError(ScannerError error);

// Print success message
void PrintSuccess(const std::string& message);

// Get user input as integer
int GetIntInput(const std::string& prompt);

// Get user input as string
std::string GetStringInput(const std::string& prompt);

// Convert hex string to address
LPVOID HexStringToAddress(const std::string& hexStr);

// Print separator line
void PrintSeparator();
