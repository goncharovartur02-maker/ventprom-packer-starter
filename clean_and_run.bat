@echo off
echo 🧹 Ventprom Packer - Complete Clean and Run
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📋 Stopping all containers...
docker-compose down

echo.
echo 🧹 Removing all containers and images...
docker-compose down --rmi all --volumes --remove-orphans

echo.
echo 🗑️ Cleaning up Docker system...
docker system prune -a -f

echo.
echo 🔧 Building with clean cache...
echo.
echo 🌐 The application will be available at: http://localhost:3000
echo 📁 Upload your example files to test the universal parser
echo.
echo Press Ctrl+C to stop the application
echo.

docker-compose up --build --force-recreate --no-cache



