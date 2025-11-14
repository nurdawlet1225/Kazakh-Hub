@echo off
REM N3XUS-OS Terminal іске қосу скрипті
REM Бөлек терезеден іске қосады

title N3XUS-OS Launcher
color 0B

cd /d "%~dp0"

if not exist "build\bin\Terminal.exe" (
    echo.
    echo [ERROR] Terminal.exe табылмады!
    echo.
    echo Алдымен құрастыру керек:
    echo   build.bat
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   N3XUS-OS Terminal Launcher
echo ========================================
echo.
echo Бөлек терезеден іске қосылуда...
echo.

REM Бөлек терезеден іске қосу
start "N3XUS-OS - Байланыс, Cyber Hub Vibe" /D "%~dp0build\bin" Terminal.exe

echo Терминал іске қосылды!
echo.
timeout /t 2 >nul
exit


