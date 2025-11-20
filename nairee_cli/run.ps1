# N3XUS-OS Terminal Runner for Windows PowerShell
# This script builds and runs the terminal application

$ErrorActionPreference = "Stop"

# Get the directory where the script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$Executable = "build\bin\Terminal.exe"
$BuildDir = "build"

Write-Host ""
Write-Host "N3XUS-OS Terminal" -ForegroundColor Green
Write-Host ""

# Check if executable exists
if (-not (Test-Path $Executable)) {
    Write-Host "Executable not found. Building project..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create build directory if it doesn't exist
    if (-not (Test-Path $BuildDir)) {
        New-Item -ItemType Directory -Path $BuildDir | Out-Null
    }
    if (-not (Test-Path "$BuildDir\bin")) {
        New-Item -ItemType Directory -Path "$BuildDir\bin" | Out-Null
    }
    
    # Check for CMake
    $cmakeFound = Get-Command cmake -ErrorAction SilentlyContinue
    if ($cmakeFound) {
        Write-Host "Using CMake to build..."
        Set-Location $BuildDir
        cmake ..
        cmake --build .
        Set-Location $ScriptDir
    }
    # Check for g++ (MinGW)
    elseif (Get-Command g++ -ErrorAction SilentlyContinue) {
        Write-Host "Using g++ to build..."
        $sourceFiles = @(
            "src\main.cpp",
            "src\Terminal.cpp",
            "src\Banner.cpp",
            "src\CommandParser.cpp",
            "src\CommandExecutor.cpp",
            "src\VFS.cpp",
            "src\commands\HelpCommand.cpp",
            "src\commands\LsCommand.cpp",
            "src\commands\DirCommand.cpp",
            "src\commands\CdCommand.cpp",
            "src\commands\MkdirCommand.cpp",
            "src\commands\CpCommand.cpp",
            "src\commands\UserInfoCommand.cpp"
        )
        & g++ -std=c++17 -Wall -O2 -o $Executable $sourceFiles -Isrc
    }
    # Check for cl (MSVC)
    elseif (Get-Command cl -ErrorAction SilentlyContinue) {
        Write-Host "Using MSVC (cl) to build..."
        $sourceFiles = @(
            "src\main.cpp",
            "src\Terminal.cpp",
            "src\Banner.cpp",
            "src\CommandParser.cpp",
            "src\CommandExecutor.cpp",
            "src\VFS.cpp",
            "src\commands\HelpCommand.cpp",
            "src\commands\LsCommand.cpp",
            "src\commands\DirCommand.cpp",
            "src\commands\CdCommand.cpp",
            "src\commands\MkdirCommand.cpp",
            "src\commands\CpCommand.cpp",
            "src\commands\UserInfoCommand.cpp"
        )
        & cl /EHsc /std:c++17 /O2 /Fe:$Executable $sourceFiles /Isrc
    }
    else {
        Write-Host "Error: No C++ compiler found (cmake, g++, or cl)" -ForegroundColor Red
        Write-Host "Please install a C++ compiler to build the project."
        exit 1
    }
    
    Write-Host ""
    Write-Host "Build completed!" -ForegroundColor Green
    Write-Host ""
}

# Run the terminal
if (Test-Path $Executable) {
    Write-Host "Starting N3XUS-OS Terminal..." -ForegroundColor Green
    Write-Host ""
    & $Executable
}
else {
    Write-Host "Error: Failed to build executable" -ForegroundColor Red
    exit 1
}

