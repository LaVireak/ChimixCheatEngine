



cmake_minimum_required(VERSION 3.11)
project(ChimixEngine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
    nlohmann_json
    URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
)
FetchContent_MakeAvailable(nlohmann_json)

# Explicitly list source files
add_executable(ChimixEngine
    main.cpp
    MemoryScanner.cpp
    ProcessManager.cpp
    Utils.cpp
)

target_link_libraries(ChimixEngine PRIVATE nlohmann_json::nlohmann_json)

# MinGW specific settings (if any)
if(MINGW)
    # Add any MinGW-specific libraries or flags here if needed
endif()




# MinGW specific settings
if(MINGW)
    # Add any MinGW-specific libraries or flags here if needed
endif()
