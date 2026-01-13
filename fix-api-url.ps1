# Fix API URL in frontend .env file
# Changes port from 8080 to 3000

$frontendPath = Join-Path $PSScriptRoot "frontend"
$envFile = Join-Path $frontendPath ".env"

Write-Host "Fixing API URL in frontend .env file..." -ForegroundColor Yellow

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Replace all occurrences of port 8080 with 3000
    $content = $content -replace 'http://localhost:8080/api', 'http://127.0.0.1:3000/api'
    $content = $content -replace 'http://127\.0\.0\.1:8080/api', 'http://127.0.0.1:3000/api'
    
    # Remove duplicate VITE_API_BASE_URL lines (keep only the first one)
    $lines = $content -split "`n"
    $seenApiUrl = $false
    $newLines = @()
    
    foreach ($line in $lines) {
        if ($line -match '^VITE_API_BASE_URL=') {
            if (-not $seenApiUrl) {
                $newLines += "# API Configuration"
                $newLines += "VITE_API_BASE_URL=http://127.0.0.1:3000/api"
                $seenApiUrl = $true
            }
        } else {
            $newLines += $line
        }
    }
    
    $newContent = $newLines -join "`n"
    Set-Content $envFile -Value $newContent
    
    Write-Host "✓ .env file updated successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "API URL changed to: http://127.0.0.1:3000/api" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠ IMPORTANT: Restart your frontend dev server for changes to take effect!" -ForegroundColor Yellow
    Write-Host "   Run: cd frontend && npm run dev" -ForegroundColor Gray
} else {
    Write-Host "✗ .env file not found at: $envFile" -ForegroundColor Red
    Write-Host "Creating new .env file..." -ForegroundColor Yellow
    
    $newEnvContent = @"
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:3000/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyCQV1oUnC4GISVmWPAk-fIk-3UOoEYBink
VITE_FIREBASE_AUTH_DOMAIN=kazakh-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kazakh-hub
VITE_FIREBASE_STORAGE_BUCKET=kazakh-hub.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=669228897264
VITE_FIREBASE_APP_ID=1:669228897264:web:095fe725a868d1eb768335
VITE_FIREBASE_MEASUREMENT_ID=G-N2X6FB3KXN
"@
    
    Set-Content $envFile -Value $newEnvContent
    Write-Host "✓ New .env file created" -ForegroundColor Green
}
