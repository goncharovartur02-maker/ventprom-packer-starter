@echo off
chcp 65001 >nul
echo Starting Ventprom Packer...
echo.
echo Stopping old containers...
docker compose -f docker-compose.dev.yml down
echo.
echo Starting new containers...
docker compose -f docker-compose.dev.yml up -d
echo.
echo Waiting for API to start...
timeout /t 10 /nobreak >nul
echo.
echo Checking API status...
docker compose -f docker-compose.dev.yml logs --tail=20 api
echo.
echo Testing API endpoint...
curl -s http://localhost:3001/presets >nul && echo "API is working!" || echo "API is not responding"
echo.
echo Opening web app...
start http://localhost:3000
echo.
echo Application started! Check http://localhost:3000
pause
