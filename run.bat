@echo off
title LocalShare - Wi-Fi File Sharing
echo ======================================================
echo           LocalShare - Wi-Fi File Sharing
echo ======================================================
echo.

:: Check if Docker is running
docker --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [1] Running via Docker Compose...
    docker compose up --build
    goto end
)

:: Fallback to Node.js
echo [2] Docker not detected. Checking Node.js...
node -v >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Installing dependencies if needed...
    call npm install
    echo Starting LocalShare on 0.0.0.0:3000...
    call npm run dev
    goto end
)

echo [ERROR] Neither Docker nor Node.js was found in PATH.
echo Please install Docker Desktop or Node.js to run LocalShare.
pause

:end
