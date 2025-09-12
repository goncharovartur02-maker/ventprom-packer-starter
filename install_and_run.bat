@echo off
echo 🚀 Ventprom Packer Setup Script
echo.

echo 📋 Step 1: Finding Node.js and npm...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found in PATH
    echo.
    echo 🔧 Please do one of the following:
    echo    1. Restart your computer after Node.js installation
    echo    2. Or manually add Node.js to PATH
    echo    3. Or run this from a new Command Prompt window
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found in PATH
    echo.
    echo 🔧 Please do one of the following:
    echo    1. Restart your computer after Node.js installation
    echo    2. Or manually add Node.js to PATH
    echo    3. Or run this from a new Command Prompt window
    echo.
    pause
    exit /b 1
)

echo ✅ npm found
npm --version
echo.

echo 📦 Step 2: Installing dependencies...
npm install
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

echo 🚀 Step 3: Starting the application...
echo.
echo 🌐 The application will be available at: http://localhost:3000
echo 📁 Upload your example files to test the universal parser
echo.
echo Press Ctrl+C to stop the application
echo.

npm run dev
