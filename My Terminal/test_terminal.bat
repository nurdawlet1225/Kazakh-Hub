@echo off
echo ========================================
echo Terminal Test Script
echo ========================================
echo.
cd /d "%~dp0"
cd build\bin

echo Testing Terminal...
echo.
echo This will run the terminal with test commands.
echo.
echo Press any key to start...
pause >nul

echo.
echo Running: Terminal.exe
echo.
Terminal.exe < test_input.txt

echo.
echo Test completed!
pause


