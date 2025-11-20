#!/bin/bash

# N3XUS-OS Terminal Runner for macOS/Linux
# This script builds and runs the terminal application

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

EXECUTABLE="build/bin/Terminal"
BUILD_DIR="build"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}N3XUS-OS Terminal${NC}"
echo ""

# Check if executable exists
if [ ! -f "$EXECUTABLE" ]; then
    echo -e "${YELLOW}Executable not found. Building project...${NC}"
    echo ""
    
    # Create build directory if it doesn't exist
    mkdir -p "$BUILD_DIR/bin"
    
    # Check for CMake
    if command -v cmake &> /dev/null; then
        echo "Using CMake to build..."
        cd "$BUILD_DIR"
        cmake ..
        cmake --build .
        cd ..
    # Check for clang++
    elif command -v clang++ &> /dev/null; then
        echo "Using clang++ to build..."
        clang++ -std=c++17 -Wall -O2 -o "$EXECUTABLE" \
            src/main.cpp \
            src/Terminal.cpp \
            src/Banner.cpp \
            src/CommandParser.cpp \
            src/CommandExecutor.cpp \
            src/VFS.cpp \
            src/commands/HelpCommand.cpp \
            src/commands/LsCommand.cpp \
            src/commands/DirCommand.cpp \
            src/commands/CdCommand.cpp \
            src/commands/MkdirCommand.cpp \
            src/commands/CpCommand.cpp \
            src/commands/UserInfoCommand.cpp \
            -Isrc
    # Check for g++
    elif command -v g++ &> /dev/null; then
        echo "Using g++ to build..."
        g++ -std=c++17 -Wall -O2 -o "$EXECUTABLE" \
            src/main.cpp \
            src/Terminal.cpp \
            src/Banner.cpp \
            src/CommandParser.cpp \
            src/CommandExecutor.cpp \
            src/VFS.cpp \
            src/commands/HelpCommand.cpp \
            src/commands/LsCommand.cpp \
            src/commands/DirCommand.cpp \
            src/commands/CdCommand.cpp \
            src/commands/MkdirCommand.cpp \
            src/commands/CpCommand.cpp \
            src/commands/UserInfoCommand.cpp \
            -Isrc
    else
        echo -e "${RED}Error: No C++ compiler found (cmake, clang++, or g++)${NC}"
        echo "Please install a C++ compiler to build the project."
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}Build completed!${NC}"
    echo ""
fi

# Run the terminal
if [ -f "$EXECUTABLE" ]; then
    echo -e "${GREEN}Starting N3XUS-OS Terminal...${NC}"
    echo ""
    "$EXECUTABLE"
else
    echo -e "${RED}Error: Failed to build executable${NC}"
    exit 1
fi

