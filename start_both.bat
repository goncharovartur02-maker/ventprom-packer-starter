@echo off
echo 🚀 Starting Ventprom Packer - API and Web
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

REM Add Node.js to PATH for this session
set "PATH=%PATH%;C:\Program Files\nodejs"

echo 📦 Starting API backend...
start "API Backend" cmd /k "cd /d %~dp0 && \"C:\Program Files\nodejs\npm.cmd\" run dev:api"

echo ⏳ Waiting 5 seconds for API to start...
timeout /t 5 /nobreak >nul

echo 🌐 Starting Web frontend...
start "Web Frontend" cmd /k "cd /d %~dp0 && \"C:\Program Files\nodejs\npm.cmd\" run dev:web"

echo.
echo ✅ Both services are starting...
echo.
echo 🌐 Web: http://localhost:3000
echo 🔧 API: http://localhost:3001
echo.
echo 📁 Upload your example files to test the universal parser
echo.
echo Press any key to close this window...
pause >nul


