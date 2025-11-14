# Terminal іске қосу скрипті
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$terminalPath = Join-Path $scriptPath "build\bin\Terminal.exe"

if (Test-Path $terminalPath) {
    Write-Host "Starting Terminal..." -ForegroundColor Green
    Write-Host ""
    & $terminalPath
} else {
    Write-Host "Error: Terminal.exe not found!" -ForegroundColor Red
    Write-Host "Path checked: $terminalPath" -ForegroundColor Yellow
    Write-Host "Please build the project first using: build.bat" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
}

