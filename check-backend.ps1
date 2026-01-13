# Comprehensive Backend Health Check Script
# Kazakh Hub Backend Full Check

$ErrorActionPreference = "Continue"
$baseUrl = "http://127.0.0.1:3000"
$backendPath = Join-Path $PSScriptRoot "backend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kazakh Hub Backend - Comprehensive Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Python Installation
Write-Host "[1/10] Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found" -ForegroundColor Red
    exit 1
}

# 2. Check Backend Directory
Write-Host "[2/10] Checking backend directory..." -ForegroundColor Yellow
if (Test-Path $backendPath) {
    Write-Host "  ✓ Backend directory exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend directory NOT found: $backendPath" -ForegroundColor Red
    exit 1
}

# 3. Check Virtual Environment
Write-Host "[3/10] Checking virtual environment..." -ForegroundColor Yellow
$venvPath = Join-Path $backendPath "venv"
if (Test-Path $venvPath) {
    Write-Host "  ✓ Virtual environment exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Virtual environment NOT found" -ForegroundColor Yellow
    Write-Host "    Run: cd backend && python -m venv venv" -ForegroundColor Gray
}

# 4. Check Required Files
Write-Host "[4/10] Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "main.py",
    "config.py",
    "database.py",
    "db.py",
    "requirements.txt"
)
$allFilesExist = $true
foreach ($file in $requiredFiles) {
    $filePath = Join-Path $backendPath $file
    if (Test-Path $filePath) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file NOT found" -ForegroundColor Red
        $allFilesExist = $false
    }
}
if (-not $allFilesExist) {
    Write-Host "  ✗ Some required files are missing" -ForegroundColor Red
    exit 1
}

# 5. Check Data Directory
Write-Host "[5/10] Checking data directory..." -ForegroundColor Yellow
$dataPath = Join-Path $backendPath "data"
if (Test-Path $dataPath) {
    Write-Host "  ✓ Data directory exists" -ForegroundColor Green
    $dataFiles = Get-ChildItem $dataPath -File | Select-Object Name, Length
    foreach ($file in $dataFiles) {
        $sizeKB = [math]::Round($file.Length / 1KB, 2)
        Write-Host "    - $($file.Name) ($sizeKB KB)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠ Data directory NOT found (will be created on first run)" -ForegroundColor Yellow
}

# 6. Check Python Dependencies
Write-Host "[6/10] Checking Python dependencies..." -ForegroundColor Yellow
Set-Location $backendPath
if (Test-Path $venvPath) {
    $pythonExe = Join-Path $venvPath "Scripts\python.exe"
    if (Test-Path $pythonExe) {
        $deps = @("fastapi", "uvicorn", "sqlalchemy", "bcrypt", "websockets")
        $allDepsOk = $true
        foreach ($dep in $deps) {
            $result = & $pythonExe -c "import $dep" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ $dep" -ForegroundColor Green
            } else {
                Write-Host "  ✗ $dep NOT installed" -ForegroundColor Red
                $allDepsOk = $false
            }
        }
        if (-not $allDepsOk) {
            Write-Host "  ⚠ Some dependencies are missing" -ForegroundColor Yellow
            Write-Host "    Run: .\venv\Scripts\Activate.ps1 && pip install -r requirements.txt" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠ Cannot check dependencies (venv python not found)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Skipping dependency check (venv not found)" -ForegroundColor Yellow
}

# 7. Check Port 3000
Write-Host "[7/10] Checking port 3000..." -ForegroundColor Yellow
$portCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -WarningAction SilentlyContinue
if ($portCheck.TcpTestSucceeded) {
    Write-Host "  ✓ Port 3000 is listening" -ForegroundColor Green
    $connection = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "    Process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ✗ Port 3000 is NOT listening" -ForegroundColor Red
    Write-Host "    Server is not running. Start it with: .\start-backend.ps1" -ForegroundColor Yellow
}

# 8. Test Server Endpoints
Write-Host "[8/10] Testing server endpoints..." -ForegroundColor Yellow
if ($portCheck.TcpTestSucceeded) {
    # Health check
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ /api/health - OK" -ForegroundColor Green
            $healthData = $response.Content | ConvertFrom-Json
            Write-Host "    Status: $($healthData.status)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ✗ /api/health - FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Root endpoint
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ / (root) - OK" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ✗ / (root) - FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # API root
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ /api - OK" -ForegroundColor Green
            $apiData = $response.Content | ConvertFrom-Json
            Write-Host "    Version: $($apiData.version)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ✗ /api - FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠ Skipping endpoint tests (server not running)" -ForegroundColor Yellow
}

# 9. Check Database Files
Write-Host "[9/10] Checking database files..." -ForegroundColor Yellow
if (Test-Path $dataPath) {
    $dbFile = Join-Path $dataPath "kazakh_hub.db"
    if (Test-Path $dbFile) {
        $dbSize = (Get-Item $dbFile).Length
        $dbSizeKB = [math]::Round($dbSize / 1KB, 2)
        Write-Host "  ✓ SQLite database exists ($dbSizeKB KB)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ SQLite database NOT found (will be created on first run)" -ForegroundColor Yellow
    }
    
    $jsonFiles = @("codes.json", "users.json", "friends.json", "messages.json", "friendRequests.json", "passwords.json")
    foreach ($jsonFile in $jsonFiles) {
        $jsonPath = Join-Path $dataPath $jsonFile
        if (Test-Path $jsonPath) {
            $size = (Get-Item $jsonPath).Length
            $sizeKB = [math]::Round($size / 1KB, 2)
            Write-Host "  ✓ $jsonFile ($sizeKB KB)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $jsonFile NOT found (will be created on first run)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ⚠ Data directory not found" -ForegroundColor Yellow
}

# 10. Check Routes
Write-Host "[10/10] Checking route files..." -ForegroundColor Yellow
$routesPath = Join-Path $backendPath "routes"
if (Test-Path $routesPath) {
    $routeFiles = @("__init__.py", "auth.py", "codes.py", "users.py", "messages.py", "friends.py", "chats.py")
    foreach ($routeFile in $routeFiles) {
        $routePath = Join-Path $routesPath $routeFile
        if (Test-Path $routePath) {
            Write-Host "  ✓ $routeFile" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $routeFile NOT found" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✗ Routes directory NOT found" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Check Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server URL: $baseUrl" -ForegroundColor Cyan
Write-Host "API URL: $baseUrl/api" -ForegroundColor Cyan
Write-Host "Docs: $baseUrl/docs" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot
