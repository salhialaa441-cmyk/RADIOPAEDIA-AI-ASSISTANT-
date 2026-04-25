@echo off
REM ============================================================================
REM  Radiopaedia Viewer - One-Click Start (Electron Desktop App)
REM ============================================================================
REM  Double-click to start the Electron desktop app.
REM  Press Ctrl+C to stop.
REM ============================================================================

cd /d "%~dp0"
title Radiopaedia Viewer

cls
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║           Radiopaedia Viewer - Desktop App               ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  Starting Electron...                                    ║
echo ║  Press Ctrl+C to stop                                    ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not installed!
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js:
node --version
echo.

REM Check node_modules
if not exist "node_modules" (
    echo [ERROR] node_modules not found!
    echo Run: npm install
    pause
    exit /b 1
)

REM Kill existing Electron processes
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq electron.exe" /NH ^| findstr "electron"') do (
    echo [INFO] Stopping existing Electron process...
    taskkill /F /IM electron.exe >nul 2>nul
    timeout /t 1 /nobreak >nul
)

echo [OK] Starting Electron dev server...
echo.

npm run electron:dev
