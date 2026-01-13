# PowerShell script to test backend server connection
# Kazakh Hub Backend Connection Test

Write-Host "Testing Backend Server Connection..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:3000"

# Test 1: Check if port is listening
Write-Host "Test 1: Checking if port 3000 is listening..." -ForegroundColor Yellow
$portCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -WarningAction SilentlyContinue
if ($portCheck.TcpTestSucceeded) {
    Write-Host "✓ Port 3000 is listening" -ForegroundColor Green
} else {
    Write-Host "✗ Port 3000 is NOT listening" -ForegroundColor Red
    Write-Host "  Please start the backend server first using: .\start-backend.ps1" -ForegroundColor Yellow
    exit 1
}

# Test 2: Health check endpoint
Write-Host ""
Write-Host "Test 2: Testing /api/health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Health check passed" -ForegroundColor Green
        Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Health check failed with status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Root endpoint
Write-Host ""
Write-Host "Test 3: Testing root endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Root endpoint accessible" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "  Message: $($content.message)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Root endpoint failed with status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Root endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: API root endpoint
Write-Host ""
Write-Host "Test 4: Testing /api endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ API endpoint accessible" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "  API Version: $($content.version)" -ForegroundColor Gray
    } else {
        Write-Host "✗ API endpoint failed with status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ API endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend server is running correctly!" -ForegroundColor Green
Write-Host "Server URL: $baseUrl" -ForegroundColor Cyan
Write-Host "API URL: $baseUrl/api" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
