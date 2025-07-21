cmake_minimum_required(VERSION 3.15)
project(ChimixCheatEngine)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find nlohmann_json (header-only)
find_package(nlohmann_json CONFIG REQUIRED)

include_directories(
    ${CMAKE_SOURCE_DIR}/desktop-app/cpp-src
    ${CMAKE_SOURCE_DIR}/desktop-app
)

add_executable(ChimixCheatEngine
    desktop-app/cpp-src/main.cpp
    desktop-app/cpp-src/ProcessManager.cpp
    desktop-app/cpp-src/MemoryScanner.cpp
    desktop-app/cpp-src/Utils.cpp
)

target_link_libraries(ChimixCheatEngine PRIVATE nlohmann_json::nlohmann_json)

target_compile_definitions(ChimixCheatEngine PRIVATE UNICODE _UNICODE)

set_target_properties(ChimixCheatEngine PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/desktop-app/build
)
