@echo off
echo 🐳 Ventprom Packer - Simple Docker Setup
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📋 Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed
    echo.
    echo 🔧 Please install Docker Desktop:
    echo    1. Go to: https://www.docker.com/products/docker-desktop/
    echo    2. Download and install Docker Desktop
    echo    3. Restart your computer
    echo    4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is installed
docker --version

echo.
echo 🧹 Cleaning up previous containers...
docker-compose down

echo.
echo 🚀 Building and starting the application...
echo.
echo 🌐 The application will be available at: http://localhost:3000
echo 📁 Upload your example files to test the universal parser
echo.
echo Press Ctrl+C to stop the application
echo.

docker-compose up --build --force-recreate

