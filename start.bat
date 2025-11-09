@echo off
title Parla Italiano - Italian Learning App
color 0A

echo.
echo ========================================
echo    PARLA ITALIANO - Starting...
echo ========================================
echo.

cd /d "%~dp0"

echo Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting Next.js server...
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================
echo    Parla Italiano is now running!
echo ========================================
echo.
echo The app is open in your browser
echo Press Ctrl+C to stop the server
echo.

call npm run dev
