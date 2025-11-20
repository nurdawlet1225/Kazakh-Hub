@echo off
title N3XUS-OS Terminal
color 0A

REM Get the directory where the script is located
cd /d "%~dp0"

set EXECUTABLE=build\bin\Terminal.exe
set BUILD_DIR=build

echo.
echo N3XUS-OS Terminal
echo.

REM Check if executable exists
if not exist "%EXECUTABLE%" (
    echo Executable not found. Building project...
    echo.
    
    REM Create build directory if it doesn't exist
    if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
    if not exist "%BUILD_DIR%\bin" mkdir "%BUILD_DIR%\bin"
    
    REM Check for CMake
    where cmake >nul 2>&1
    if %ERRORLEVEL% == 0 (
        echo Using CMake to build...
        cd "%BUILD_DIR%"
        cmake ..
        cmake --build .
        cd ..
    REM Check for g++ (MinGW)
    ) else (
        where g++ >nul 2>&1
        if %ERRORLEVEL% == 0 (
            echo Using g++ to build...
            g++ -std=c++17 -Wall -O2 -o "%EXECUTABLE%" ^
                src\main.cpp ^
                src\Terminal.cpp ^
                src\Banner.cpp ^
                src\CommandParser.cpp ^
                src\CommandExecutor.cpp ^
                src\VFS.cpp ^
                src\commands\HelpCommand.cpp ^
                src\commands\LsCommand.cpp ^
                src\commands\DirCommand.cpp ^
                src\commands\CdCommand.cpp ^
                src\commands\MkdirCommand.cpp ^
                src\commands\CpCommand.cpp ^
                src\commands\UserInfoCommand.cpp ^
                -Isrc
        ) else (
            echo Error: No C++ compiler found (cmake or g++)
            echo Please install a C++ compiler to build the project.
            pause
            exit /b 1
        )
    )
    
    echo.
    echo Build completed!
    echo.
)

REM Run the terminal
if exist "%EXECUTABLE%" (
    echo Starting N3XUS-OS Terminal...
    echo.
    "%EXECUTABLE%"
) else (
    echo Error: Failed to build executable
    pause
    exit /b 1
)

