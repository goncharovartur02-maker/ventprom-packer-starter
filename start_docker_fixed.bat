@echo off
echo Starting VentProm Packer with FIXED Docker Compose...
echo.

echo Stopping any existing containers...
docker-compose down

echo.
echo Building and starting services with fixed TypeScript...
docker-compose up --build -d

echo.
echo Services started! Checking status:
docker-compose ps

echo.
echo To view logs:
echo docker-compose logs -f

echo.
echo To stop services:
echo docker-compose down

echo.
echo Web application: http://localhost:3000
echo API: http://localhost:3001

echo.
echo Press any key to continue...
pause
