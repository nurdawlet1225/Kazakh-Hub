@echo off
title N3XUS-OS Terminal
color 0A
cd /d "%~dp0"
cd build
if exist bin\Terminal.exe (
    echo.
    echo Starting N3XUS-OS Terminal...
    echo.
    bin\Terminal.exe
) else (
    echo Error: Terminal.exe not found!
    echo Please build the project first using: build.bat
    pause
)

