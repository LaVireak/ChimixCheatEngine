

cmake_minimum_required(VERSION 3.16)
project(ChimixEngine)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

## Use local single-header nlohmann/json (include/nlohmann/json.hpp)
## No CMake logic needed; just ensure the include path is correct.


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
list(FILTER SOURCES EXCLUDE REGEX ".*/test_json.cpp$")


add_executable(ChimixEngine ${SOURCES})


# Use the absolute path for the include directory
target_include_directories(ChimixEngine PRIVATE "d:/Side Quest/ChimixCheatEngine/desktop-app/include")

# No need to link nlohmann_json as a library; it's header-only.

# Windows specific
if(WIN32)
    target_link_libraries(ChimixEngine PRIVATE psapi)
endif()
