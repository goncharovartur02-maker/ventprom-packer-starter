@echo off
echo ========================================
echo SIMPLE DOCKER SOLUTION
echo ========================================
echo.

echo This will use a single Dockerfile for everything.
echo.

pause

echo Stopping containers...
docker-compose -f docker-compose.simple.yml down

echo.
echo Building and starting...
docker-compose -f docker-compose.simple.yml up --build -d

echo.
echo Checking status...
docker-compose -f docker-compose.simple.yml ps

echo.
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo.
pause

