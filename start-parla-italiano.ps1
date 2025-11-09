# Parla Italiano - Launch Script
# Double-click the desktop shortcut to run this

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     PARLA ITALIANO - Starting...      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Navigate to project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Installing dependencies (first time only)..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start dev server
Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Cyan
Write-Host ""

# Start the server and capture output
$serverJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev 2>&1
} -ArgumentList $scriptPath

# Wait for server to be ready by checking output
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
$ready = $false
$timeout = 30 # seconds
$elapsed = 0

while (-not $ready -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 1
    $elapsed++

    $output = Receive-Job -Job $serverJob
    if ($output -match "Local:.*http://localhost:3000" -or $output -match "Ready in") {
        $ready = $true
    }
}

if ($ready) {
    Write-Host "✅ Server is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Opening browser at http://localhost:3000" -ForegroundColor Cyan
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:3000"
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   Parla Italiano is now running!      ║" -ForegroundColor Green
    Write-Host "║   Learn Italian in your browser        ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📚 The app is open in your browser" -ForegroundColor White
    Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host "🔄 Minimize this window (server keeps running)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ Server did not start in time. Check for errors above." -ForegroundColor Red
}

# Keep window open and show server output
try {
    while ($true) {
        $output = Receive-Job -Job $serverJob
        if ($output) {
            Write-Host $output
        }
        Start-Sleep -Milliseconds 100
    }
} finally {
    Stop-Job -Job $serverJob
    Remove-Job -Job $serverJob
}
