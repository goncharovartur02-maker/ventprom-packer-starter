@echo off
echo 🐳 Ventprom Packer - Node.js Docker
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📋 Stopping any running containers...
docker-compose -f docker-compose.nodejs.yml down

echo.
echo 🧹 Cleaning up Docker cache...
docker system prune -f

echo.
echo 🚀 Building and starting Node.js Docker...
echo.
echo 🌐 The application will be available at: http://localhost:3000
echo 📁 Upload your example files to test the universal parser
echo.
echo Press Ctrl+C to stop the application
echo.

docker-compose -f docker-compose.nodejs.yml up --build --force-recreate



