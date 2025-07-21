// C++ server mode template for ChimixCheatEngine
// Place this in your main.cpp and call runServerMode() if --server is passed
// Requires nlohmann/json (https://github.com/nlohmann/json)

#include <iostream>
#include <string>
#include <sstream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

void runServerMode() {
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        try {
            json request = json::parse(line);
            json response;
            response["id"] = request.value("id", 0);
            response["type"] = request.value("type", "");
            // Example: handle attach
            if (request["type"] == "attach") {
                // TODO: Implement real attach logic
                response["data"] = {
                    {"name", request.value("processName", "")},
                    {"pid", 1234}
                };
            } else if (request["type"] == "getProcessList") {
                // TODO: Implement real process list
                response["data"] = json::array({
                    {{"name", "example.exe"}, {"pid", 1234}},
                    {{"name", "other.exe"}, {"pid", 5678}}
                });
            } else if (request["type"] == "scan") {
                // TODO: Implement real scan
                response["data"] = json::array({
                    {{"address", "0x00400000"}, {"value", 42}, {"type", "int32"}}
                });
            } else if (request["type"] == "modify") {
                // TODO: Implement real memory modify
                response["data"] = {
                    {"address", request.value("address", "")},
                    {"value", request.value("value", 0)},
                    {"success", true}
                };
            } else {
                response["error"] = "Unknown command type";
            }
            std::cout << response.dump() << std::endl;
        } catch (const std::exception& ex) {
            json err;
            err["error"] = std::string("Parse/handler error: ") + ex.what();
            std::cout << err.dump() << std::endl;
        }
    }
}

// In your main():
// if (hasServerFlag) runServerMode();
