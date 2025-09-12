@echo off
echo 🚀 Starting Ventprom Packer
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📦 Starting API backend...
start "API Backend" cmd /k "cd /d %~dp0\apps\api && node ../../node_modules/.bin/nest start --watch"

echo ⏳ Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo 🌐 Starting Web frontend...
start "Web Frontend" cmd /k "cd /d %~dp0\apps\web && node ../../node_modules/.bin/next dev"

echo.
echo ✅ Both services are starting...
echo.
echo 🌐 Web: http://localhost:3000
echo 🔧 API: http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul




