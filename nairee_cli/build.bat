@echo off
echo Building Terminal...

REM Check for g++
where g++ >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using g++ compiler...
    if not exist build mkdir build
    cd build
    g++ -std=c++17 -Wall -Wextra -O2 -o Terminal.exe ..\src\main.cpp ..\src\Terminal.cpp ..\src\CommandParser.cpp ..\src\CommandExecutor.cpp ..\src\VFS.cpp ..\src\commands\HelpCommand.cpp ..\src\commands\LsCommand.cpp ..\src\commands\CdCommand.cpp ..\src\commands\MkdirCommand.cpp ..\src\commands\UserInfoCommand.cpp -I..\src -I..\include
    if %ERRORLEVEL% EQU 0 (
        echo Build successful!
        echo.
        echo To run: build\Terminal.exe
    ) else (
        echo Build failed!
    )
    cd ..
    exit /b %ERRORLEVEL%
)

REM Check for cl (MSVC)
where cl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using MSVC compiler...
    if not exist build mkdir build
    cd build
    cl /EHsc /std:c++17 /O2 /Fe:Terminal.exe ..\src\main.cpp ..\src\Terminal.cpp ..\src\CommandParser.cpp ..\src\CommandExecutor.cpp ..\src\VFS.cpp ..\src\commands\HelpCommand.cpp ..\src\commands\LsCommand.cpp ..\src\commands\CdCommand.cpp ..\src\commands\MkdirCommand.cpp ..\src\commands\UserInfoCommand.cpp /I..\src /I..\include
    if %ERRORLEVEL% EQU 0 (
        echo Build successful!
        echo.
        echo To run: build\Terminal.exe
    ) else (
        echo Build failed!
    )
    cd ..
    exit /b %ERRORLEVEL%
)

echo.
echo ERROR: No C++ compiler found!
echo.
echo Please install one of the following:
echo   1. MinGW-w64 (for g++)
echo   2. Visual Studio Build Tools (for cl)
echo   3. CMake (for building with CMake)
echo.
echo Or use an IDE like Visual Studio, Code::Blocks, or CLion.
pause

