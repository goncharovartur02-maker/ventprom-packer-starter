@echo off
echo 🚀 Ventprom Packer - Quick Start
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

REM Add Node.js to PATH for this session
set "PATH=%PATH%;C:\Program Files\nodejs"

echo 📦 Installing core dependencies only...
echo.

REM Install only the essential dependencies
call npm.cmd install --no-optional --ignore-scripts
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    echo.
    echo 🔧 Trying alternative approach...
    call npm.cmd install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo ❌ Still failed. Let's try a different approach.
        pause
        exit /b 1
    )
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




