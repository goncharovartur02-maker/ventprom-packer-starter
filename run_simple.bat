@echo off
echo 🚀 Ventprom Packer - Simple Setup
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📋 Adding Node.js to PATH...
set PATH=%PATH%;C:\Program Files\nodejs

echo.
echo 🔍 Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo.
    echo 🔧 Please install Node.js:
    echo    1. Go to: https://nodejs.org/
    echo    2. Download and install LTS version
    echo    3. Restart your computer
    echo    4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js is installed

echo.
echo 📦 Installing dependencies (this may take a few minutes)...
npm install --legacy-peer-deps --ignore-scripts

echo.
echo 🌐 Starting the application...
echo.
echo 🌐 The application will be available at: http://localhost:3000
echo 📁 Upload your example files to test the universal parser
echo.
echo Press Ctrl+C to stop the application
echo.

npm run dev



