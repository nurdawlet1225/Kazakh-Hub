# Terminal Project Structure

## Overview
This is a terminal emulator application written in C++ that provides a virtual file system and command-line interface.

## Directory Structure

```
terminal/
├── src/                    # Source code directory
│   ├── main.cpp           # Application entry point
│   ├── Terminal.cpp       # Main terminal class implementation
│   ├── Terminal.hpp       # Main terminal class header
│   ├── CommandParser.cpp  # Command parsing logic
│   ├── CommandParser.hpp  # Command parser header
│   ├── CommandExecutor.cpp # Command execution logic
│   ├── CommandExecutor.hpp # Command executor header
│   ├── VFS.cpp            # Virtual File System implementation
│   ├── VFS.hpp            # Virtual File System header
│   └── commands/          # Command implementations
│       ├── HelpCommand.cpp
│       ├── HelpCommand.hpp
│       ├── LsCommand.cpp
│       ├── LsCommand.hpp
│       ├── CdCommand.cpp
│       ├── CdCommand.hpp
│       ├── MkdirCommand.cpp
│       ├── MkdirCommand.hpp
│       ├── UserInfoCommand.cpp
│       └── UserInfoCommand.hpp
├── include/               # Common headers (if needed)
├── build/                 # Build output directory
├── CMakeLists.txt         # CMake build configuration
└── docs/                  # Documentation
    └── structure.md       # This file
```

## Components

### Core Components

#### Terminal (`Terminal.cpp/hpp`)
- Main application class
- Manages the terminal loop
- Handles user input/output
- Coordinates between parser and executor

#### CommandParser (`CommandParser.cpp/hpp`)
- Parses user input into commands and arguments
- Handles tokenization and whitespace
- Supports quoted arguments

#### CommandExecutor (`CommandExecutor.cpp/hpp`)
- Executes parsed commands
- Maintains registry of available commands
- Routes commands to appropriate handlers

#### VFS (`VFS.cpp/hpp`)
- Virtual File System implementation
- Manages directory structure in memory
- Provides file/directory operations
- Handles path resolution and navigation

### Command Implementations

#### HelpCommand
- Displays list of available commands and their usage

#### LsCommand
- Lists directory contents
- Shows file and directory types
- Supports optional path argument

#### CdCommand
- Changes current working directory
- Supports absolute and relative paths
- Handles special paths (., .., /)

#### MkdirCommand
- Creates new directories
- Validates path and prevents duplicates

#### UserInfoCommand
- Displays system user information
- Shows username, hostname, and current time
- Platform-specific implementation

## Building

### Prerequisites
- CMake 3.10 or higher
- C++17 compatible compiler (GCC, Clang, MSVC)

### Build Instructions

```bash
# Create build directory
mkdir build
cd build

# Configure
cmake ..

# Build
cmake --build .

# Run
./Terminal  # Linux/macOS
# or
Terminal.exe  # Windows
```

## Usage

### Available Commands

- `help` - Display help message
- `ls [path]` - List directory contents
- `cd [path]` - Change directory
- `mkdir <path>` - Create directory
- `pwd` - Print current working directory
- `userinfo` - Display user information
- `clear` - Clear terminal screen
- `exit` / `quit` - Exit terminal

### Examples

```bash
$ mkdir test
Directory created: test

$ cd test
$ pwd
/test

$ cd ..
$ ls
[DIR]  test

$ userinfo
=== User Information ===
Username: user
...

$ exit
Goodbye!
```

## Architecture

The application follows a modular architecture:

1. **Input Layer**: Terminal class reads user input
2. **Parsing Layer**: CommandParser tokenizes and parses input
3. **Execution Layer**: CommandExecutor routes to command handlers
4. **Storage Layer**: VFS manages virtual file system state

Each command is implemented as a separate class with a static `execute` method, making it easy to add new commands.

## Extending

To add a new command:

1. Create `NewCommand.cpp` and `NewCommand.hpp` in `src/commands/`
2. Implement static `execute` method
3. Register in `CommandExecutor::initializeCommands()`
4. Add to help text in `HelpCommand::printHelp()`

## License

This project is provided as-is for educational purposes.

