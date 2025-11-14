@echo off
REM MinGW DLL файлдарын көшіру скрипті
echo Copying MinGW DLLs to build\bin...

REM MinGW жолын табу
for /f "delims=" %%i in ('where g++ 2^>nul') do (
    set "GXX_PATH=%%i"
    goto :found
)

echo Error: g++ not found in PATH!
pause
exit /b 1

:found
REM g++ жолынан bin папкасын алу
for %%i in ("%GXX_PATH%") do set "MINGW_BIN=%%~dpi"

if not exist "%MINGW_BIN%libstdc++-6.dll" (
    echo Error: MinGW DLLs not found in %MINGW_BIN%
    pause
    exit /b 1
)

REM DLL файлдарын көшіру
if not exist "build\bin" mkdir build\bin
copy /Y "%MINGW_BIN%libstdc++-6.dll" "build\bin\" >nul
copy /Y "%MINGW_BIN%libgcc_s_seh-1.dll" "build\bin\" >nul
copy /Y "%MINGW_BIN%libwinpthread-1.dll" "build\bin\" >nul

echo DLLs copied successfully!
echo.
echo Files copied:
dir /b build\bin\*.dll
echo.


