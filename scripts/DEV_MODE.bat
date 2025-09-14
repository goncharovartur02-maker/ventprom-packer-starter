@echo off
echo ========================================
echo DEVELOPMENT MODE - Hot Reload
echo ========================================
echo.

echo This will start the application in development mode.
echo Changes will be reflected immediately without rebuilding.
echo.

pause

echo Stopping any running containers...
docker-compose -f docker-compose.dev.yml down

echo.
echo Building and starting in development mode...
docker-compose -f docker-compose.dev.yml up --build -d

echo.
echo Waiting for services to start...
timeout /t 15

echo.
echo Checking status...
docker-compose -f docker-compose.dev.yml ps

echo.
echo ========================================
echo DEVELOPMENT MODE STARTED
echo ========================================
echo.
echo Web: http://localhost:3000 (with hot reload)
echo API: http://localhost:3001 (with hot reload)
echo.
echo Now you can edit files and see changes immediately!
echo.
echo To stop: docker-compose -f docker-compose.dev.yml down
echo.
pause

