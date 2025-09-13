@echo off
title Ventprom Packer - Quick Start
color 0A

echo.
echo ========================================
echo    VENTPROM PACKER - QUICK START
echo ========================================
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo Current directory: %CD%
echo.

echo Step 1: Installing dependencies...
echo.
echo Installing root dependencies...
npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    echo.
    echo Please check:
    echo 1. Node.js is installed
    echo 2. npm is working
    echo 3. Internet connection
    echo.
    pause
    exit /b 1
)
echo SUCCESS: Root dependencies installed!

echo.
echo Step 2: Building packages...
echo.
echo Building @ventprom/core...
npm run build:core
if %errorlevel% neq 0 (
    echo ERROR: Failed to build @ventprom/core
    echo.
    echo Please check:
    echo 1. Node.js is installed
    echo 2. npm is working
    echo 3. TypeScript is installed
    echo.
    pause
    exit /b 1
)
echo SUCCESS: @ventprom/core built!

echo.
echo Building @ventprom/parsers...
npm run build:parsers
if %errorlevel% neq 0 (
    echo ERROR: Failed to build @ventprom/parsers
    echo.
    echo Please check:
    echo 1. Node.js is installed
    echo 2. npm is working
    echo 3. TypeScript is installed
    echo.
    pause
    exit /b 1
)
echo SUCCESS: @ventprom/parsers built!

echo.
echo Step 3: Starting application...
echo.
echo Starting API server on port 3001...
start "API Server" cmd /k "cd apps\api && npm run start:dev"

echo Waiting 5 seconds for API to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting Web server on port 3000...
start "Web Server" cmd /k "cd apps\web && npm run dev"

echo.
echo ========================================
echo    APPLICATION STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Web Interface: http://localhost:3000
echo API Endpoint:  http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul
