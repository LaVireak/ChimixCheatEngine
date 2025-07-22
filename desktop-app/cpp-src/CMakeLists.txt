



cmake_minimum_required(VERSION 3.11)
project(ChimixEngine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(nlohmann_json QUIET)
if(NOT nlohmann_json_FOUND)
    include(FetchContent)
    FetchContent_Declare(
        nlohmann_json
        URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
    )
    FetchContent_MakeAvailable(nlohmann_json)
endif()

add_executable(ChimixEngine
    main.cpp
    MemoryScanner.cpp
    ProcessManager.cpp
    Utils.cpp
)

target_link_libraries(ChimixEngine PRIVATE nlohmann_json::nlohmann_json)

# MinGW specific settings (if any)
if(MINGW)
    # Link to psapi and enable static linking for Windows compatibility
    target_link_libraries(ChimixEngine PRIVATE psapi)
    set_target_properties(ChimixEngine PROPERTIES LINK_FLAGS "-static")
endif()
