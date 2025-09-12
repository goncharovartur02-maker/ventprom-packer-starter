@echo off
echo 🐳 Ventprom Packer - Final Docker Setup
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📋 Stopping any running containers...
docker-compose down

echo.
echo 🧹 Cleaning up Docker cache...
docker system prune -f

echo.
echo 🔧 Building with fixed Dockerfiles...
echo.
echo 🌐 The application will be available at: http://localhost:3000
echo 📁 Upload your example files to test the universal parser
echo.
echo Press Ctrl+C to stop the application
echo.

docker-compose up --build --force-recreate


