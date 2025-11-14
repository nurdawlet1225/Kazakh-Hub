cmake_minimum_required(VERSION 3.10)
project(Terminal VERSION 1.0.0 LANGUAGES CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Build configuration
set(CMAKE_BUILD_TYPE Release)
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug)
endif()

# Output directory
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# Source files
set(SOURCES
    src/main.cpp
    src/Terminal.cpp
    src/Banner.cpp
    src/CommandParser.cpp
    src/CommandExecutor.cpp
    src/VFS.cpp
    src/commands/HelpCommand.cpp
    src/commands/LsCommand.cpp
    src/commands/DirCommand.cpp
    src/commands/CdCommand.cpp
    src/commands/MkdirCommand.cpp
    src/commands/CpCommand.cpp
    src/commands/UserInfoCommand.cpp
)

# Header files
set(HEADERS
    src/Terminal.hpp
    src/Banner.hpp
    src/CommandParser.hpp
    src/CommandExecutor.hpp
    src/VFS.hpp
    src/commands/HelpCommand.hpp
    src/commands/LsCommand.hpp
    src/commands/DirCommand.hpp
    src/commands/CdCommand.hpp
    src/commands/MkdirCommand.hpp
    src/commands/CpCommand.hpp
    src/commands/UserInfoCommand.hpp
)

# Create executable
add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS})

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_SOURCE_DIR}/include
)

# Compiler-specific options
if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /W4)
else()
    target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -pedantic)
endif()

# Platform-specific libraries
if(UNIX AND NOT APPLE)
    # Linux-specific
endif()

if(APPLE)
    # macOS-specific
endif()

if(WIN32)
    # Windows-specific
    # Copy MinGW DLLs to output directory
    if(MINGW)
        # Try to find MinGW DLLs automatically
        find_program(MINGW_GXX NAMES g++ x86_64-w64-mingw32-g++)
        if(MINGW_GXX)
            get_filename_component(MINGW_BIN_DIR ${MINGW_GXX} DIRECTORY)
            add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
                COMMAND ${CMAKE_COMMAND} -E copy_if_different
                    "${MINGW_BIN_DIR}/libstdc++-6.dll"
                    "${MINGW_BIN_DIR}/libgcc_s_seh-1.dll"
                    "${MINGW_BIN_DIR}/libwinpthread-1.dll"
                    ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}
                COMMENT "Copying MinGW DLLs from ${MINGW_BIN_DIR}..."
            )
        endif()
    endif()
endif()

# Installation (optional)
install(TARGETS ${PROJECT_NAME}
    RUNTIME DESTINATION bin
)

