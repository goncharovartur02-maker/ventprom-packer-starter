@echo off
echo 🚀 Ventprom Packer - Workspace Setup
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📦 Step 1: Building packages...
call build_packages.bat
if %errorlevel% neq 0 (
    echo ❌ Failed to build packages
    pause
    exit /b 1
)

echo.
echo 🐳 Step 2: Starting with Docker...
echo.
echo Choose option:
echo 1. Single container (both API and Web)
echo 2. Separate containers
echo 3. Local development (no Docker)
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🐳 Starting single container...
    docker-compose -f docker-compose.workspace.yml up --build app
) else if "%choice%"=="2" (
    echo.
    echo 🐳 Starting separate containers...
    docker-compose -f docker-compose.workspace.yml up --build
) else if "%choice%"=="3" (
    echo.
    echo 💻 Starting local development...
    echo.
    echo Starting API on port 3001...
    start "API" cmd /k "cd apps\api && npm run start:dev"
    timeout /t 3 /nobreak >nul
    echo.
    echo Starting Web on port 3000...
    start "Web" cmd /k "cd apps\web && npm run dev"
    echo.
    echo ✅ Both services started!
    echo 🌐 Web: http://localhost:3000
    echo 🔌 API: http://localhost:3001
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
pause
