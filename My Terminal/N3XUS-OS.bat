@echo off
title N3XUS-OS - Байланыс, Cyber Hub Vibe
color 0A
cd /d "%~dp0"
cd build\bin

if exist Terminal.exe (
    echo.
    echo Starting N3XUS-OS Terminal...
    echo.
    start "N3XUS-OS Terminal" cmd /k Terminal.exe
) else (
    echo Error: Terminal.exe not found!
    echo Please build the project first using: build.bat
    pause
)


