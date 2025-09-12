@echo off
echo 🚀 Ventprom Packer - Starting Application
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

REM Add Node.js to PATH for this session
set "PATH=%PATH%;C:\Program Files\nodejs"

echo 📦 Installing dependencies...
call npm.cmd install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    echo.
    echo 🔧 Try running: npm cache clean --force
    echo    Then run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

echo 🚀 Starting the application...
echo.
echo 🌐 The application will be available at: http://localhost:3000
echo 📁 Upload your example files to test the universal parser
echo.
echo Press Ctrl+C to stop the application
echo.

call npm.cmd run dev
