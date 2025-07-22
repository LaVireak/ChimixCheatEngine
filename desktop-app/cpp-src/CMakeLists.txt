


cmake_minimum_required(VERSION 3.11)
project(ChimixEngine LANGUAGES CXX)

include(FetchContent)
FetchContent_Declare(json
    URL https://github.com/nlohmann/json/releases/download/v3.12.0/json.tar.xz
)
FetchContent_MakeAvailable(json)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)




# Source files: only from cpp-src, exclude build, _deps, third-party, dist-new, etc.


# Build all project source files except test_json.cpp
file(GLOB_RECURSE SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/*.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/*.h
)
list(FILTER SOURCES EXCLUDE REGEX ".*/build/.*")
list(FILTER SOURCES EXCLUDE REGEX ".*/_deps/.*")
list(FILTER SOURCES EXCLUDE REGEX ".*/third-party/.*")
list(FILTER SOURCES EXCLUDE REGEX ".*/dist-new/.*")
list(FILTER SOURCES EXCLUDE REGEX ".*/CMakeFiles/.*")
list(FILTER SOURCES EXCLUDE REGEX ".*/CMakeCXXCompilerId.cpp$")
list(FILTER SOURCES EXCLUDE REGEX ".*/test_json.cpp$")



add_executable(ChimixEngine ${SOURCES})
target_link_libraries(ChimixEngine PRIVATE nlohmann_json::nlohmann_json)




# MinGW specific settings
if(MINGW)
    # Add any MinGW-specific libraries or flags here if needed
endif()
