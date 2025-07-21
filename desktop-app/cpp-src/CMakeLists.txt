

cmake_minimum_required(VERSION 3.16)
project(ChimixEngine)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add nlohmann/json
find_package(nlohmann_json 3.11.0 QUIET)
if(NOT nlohmann_json_FOUND)
    add_subdirectory(third-party/json)
endif()

# Source files
file(GLOB_RECURSE SOURCES "*.cpp" "*.h")
# Exclude unwanted files and folders from SOURCES
list(FILTER SOURCES EXCLUDE REGEX "third-party/json/docs/")
list(FILTER SOURCES EXCLUDE REGEX "third-party/json/tests/")
list(FILTER SOURCES EXCLUDE REGEX "third-party/json/cmake/")
list(FILTER SOURCES EXCLUDE REGEX "third-party/json/tools/")
list(FILTER SOURCES EXCLUDE REGEX "CMakeFiles/")

# Create executable

add_executable(ChimixEngine ${SOURCES})

# If using the subdirectory fallback, add the include path for nlohmann/json.hpp

# Always add the local include path for nlohmann/json.hpp
target_include_directories(ChimixEngine PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)

if(NOT nlohmann_json_FOUND)
    target_include_directories(ChimixEngine PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/third-party/json/include)
endif()

# Link libraries
if(nlohmann_json_FOUND)
    target_link_libraries(ChimixEngine PRIVATE nlohmann_json::nlohmann_json)
else()
    target_link_libraries(ChimixEngine PRIVATE nlohmann_json)
endif()

# Windows specific
if(WIN32)
    target_link_libraries(ChimixEngine PRIVATE psapi)
endif()
