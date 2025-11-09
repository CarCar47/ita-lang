# Create Desktop Shortcut for Parla Italiano
# Run this ONCE to create the desktop shortcut

Write-Host "Creating desktop shortcut for Parla Italiano..." -ForegroundColor Cyan
Write-Host ""

# Get paths
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$launchScript = Join-Path $scriptPath "start-parla-italiano.ps1"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Parla Italiano.lnk"

# Verify launch script exists
if (-not (Test-Path $launchScript)) {
    Write-Host "❌ Error: start-parla-italiano.ps1 not found!" -ForegroundColor Red
    Write-Host "   Make sure this script is in the same folder as start-parla-italiano.ps1" -ForegroundColor Yellow
    pause
    exit 1
}

# Create shortcut
try {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-ExecutionPolicy Bypass -NoProfile -File `"$launchScript`""
    $shortcut.WorkingDirectory = $scriptPath
    $shortcut.IconLocation = "%SystemRoot%\System32\imageres.dll,3" # Globe icon
    $shortcut.Description = "Launch Parla Italiano - Learn Italian"
    $shortcut.WindowStyle = 1 # Normal window
    $shortcut.Save()

    Write-Host "✅ Desktop shortcut created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Location: $shortcutPath" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Go to your Desktop" -ForegroundColor White
    Write-Host "   2. Find the 'Parla Italiano' shortcut" -ForegroundColor White
    Write-Host "   3. Double-click it to launch the app!" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Tip: You can right-click the shortcut and choose 'Pin to Taskbar'" -ForegroundColor Yellow
    Write-Host "   for even easier access!" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ Error creating shortcut: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
