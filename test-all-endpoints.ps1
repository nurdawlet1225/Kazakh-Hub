# Comprehensive API Endpoints Test
# Tests all backend API endpoints

$baseUrl = "http://127.0.0.1:3000/api"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $url = "$baseUrl$Endpoint"
    $result = @{
        Method = $Method
        Endpoint = $Endpoint
        Status = "Unknown"
        Message = ""
    }
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = 10
            Headers = $Headers
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $result.Status = "OK"
        $result.Message = "Status: $($response.StatusCode)"
        
        if ($response.Content) {
            try {
                $json = $response.Content | ConvertFrom-Json
                $result.Message += " | Response: OK"
            } catch {
                $result.Message += " | Response: Text"
            }
        }
    } catch {
        $result.Status = "FAILED"
        $result.Message = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            $result.Message = "HTTP $statusCode - $($result.Message)"
        }
    }
    
    return $result
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing All Backend API Endpoints" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1] Testing Health Check..." -ForegroundColor Yellow
$result = Test-Endpoint -Method "GET" -Endpoint "/health"
$testResults += $result
if ($result.Status -eq "OK") {
    Write-Host "  ✓ Health check passed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Health check failed: $($result.Message)" -ForegroundColor Red
}

# Test 2: Get Codes (should work without auth)
Write-Host "[2] Testing GET /codes..." -ForegroundColor Yellow
$result = Test-Endpoint -Method "GET" -Endpoint "/codes"
$testResults += $result
if ($result.Status -eq "OK") {
    Write-Host "  ✓ Get codes endpoint works" -ForegroundColor Green
} else {
    Write-Host "  ✗ Get codes failed: $($result.Message)" -ForegroundColor Red
}

# Test 3: Get Codes with pagination
Write-Host "[3] Testing GET /codes?limit=5..." -ForegroundColor Yellow
$result = Test-Endpoint -Method "GET" -Endpoint "/codes?limit=5"
$testResults += $result
if ($result.Status -eq "OK") {
    Write-Host "  ✓ Get codes with pagination works" -ForegroundColor Green
} else {
    Write-Host "  ✗ Get codes with pagination failed: $($result.Message)" -ForegroundColor Red
}

# Test 4: Search Users
Write-Host "[4] Testing GET /users/search..." -ForegroundColor Yellow
$result = Test-Endpoint -Method "GET" -Endpoint "/users/search?q=test"
$testResults += $result
if ($result.Status -eq "OK") {
    Write-Host "  ✓ User search endpoint works" -ForegroundColor Green
} else {
    Write-Host "  ✗ User search failed: $($result.Message)" -ForegroundColor Red
}

# Test 5: Register endpoint (should accept POST but may fail without valid data)
Write-Host "[5] Testing POST /auth/register (validation test)..." -ForegroundColor Yellow
$registerData = @{
    username = ""
    email = ""
    password = ""
}
$result = Test-Endpoint -Method "POST" -Endpoint "/auth/register" -Body $registerData
$testResults += $result
if ($result.Status -eq "FAILED" -and $result.Message -match "400|required") {
    Write-Host "  ✓ Register endpoint validates input correctly" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Register endpoint: $($result.Message)" -ForegroundColor Yellow
}

# Test 6: Login endpoint (should accept POST but may fail without valid credentials)
Write-Host "[6] Testing POST /auth/login (validation test)..." -ForegroundColor Yellow
$loginData = @{
    emailOrUsername = ""
    password = ""
}
$result = Test-Endpoint -Method "POST" -Endpoint "/auth/login" -Body $loginData
$testResults += $result
if ($result.Status -eq "FAILED" -and $result.Message -match "400|required|401|credentials") {
    Write-Host "  ✓ Login endpoint validates input correctly" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Login endpoint: $($result.Message)" -ForegroundColor Yellow
}

# Test 7: Get Friend Requests (should work but may return empty)
Write-Host "[7] Testing GET /friend-requests/{user_id}..." -ForegroundColor Yellow
$result = Test-Endpoint -Method "GET" -Endpoint "/friend-requests/test123"
$testResults += $result
if ($result.Status -eq "OK") {
    Write-Host "  ✓ Friend requests endpoint accessible" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Friend requests endpoint: $($result.Message)" -ForegroundColor Yellow
}

# Test 8: Get Messages (should work but may return empty)
Write-Host "[8] Testing GET /messages/{user_id}..." -ForegroundColor Yellow
$result = Test-Endpoint -Method "GET" -Endpoint "/messages/test123"
$testResults += $result
if ($result.Status -eq "OK") {
    Write-Host "  ✓ Messages endpoint accessible" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Messages endpoint: $($result.Message)" -ForegroundColor Yellow
}

# Test 9: Get Chats (should work but may return empty)
Write-Host "[9] Testing GET /chats/{user_id}..." -ForegroundColor Yellow
$result = Test-Endpoint -Method "GET" -Endpoint "/chats/test123"
$testResults += $result
if ($result.Status -eq "OK") {
    Write-Host "  ✓ Chats endpoint accessible" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Chats endpoint: $($result.Message)" -ForegroundColor Yellow
}

# Test 10: Get Friends (should work but may return empty)
Write-Host "[10] Testing GET /friends/{user_id}..." -ForegroundColor Yellow
$result = Test-Endpoint -Method "GET" -Endpoint "/friends/test123"
$testResults += $result
if ($result.Status -eq "OK") {
    Write-Host "  ✓ Friends endpoint accessible" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Friends endpoint: $($result.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$okCount = ($testResults | Where-Object { $_.Status -eq "OK" }).Count
$failedCount = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$totalCount = $testResults.Count

Write-Host "Total Tests: $totalCount" -ForegroundColor Cyan
Write-Host "Passed: $okCount" -ForegroundColor Green
Write-Host "Failed: $failedCount" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($okCount -eq $totalCount) {
    Write-Host "✓ All endpoints are working correctly!" -ForegroundColor Green
} elseif ($okCount -gt 0) {
    Write-Host "⚠ Some endpoints need attention" -ForegroundColor Yellow
} else {
    Write-Host "✗ Server may not be running or endpoints are not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "Detailed Results:" -ForegroundColor Cyan
foreach ($test in $testResults) {
    $statusColor = if ($test.Status -eq "OK") { "Green" } else { "Red" }
    Write-Host "  $($test.Method) $($test.Endpoint) - $($test.Status)" -ForegroundColor $statusColor
    if ($test.Message) {
        Write-Host "    $($test.Message)" -ForegroundColor Gray
    }
}
