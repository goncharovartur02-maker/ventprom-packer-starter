@echo off
echo ========================================
echo STOPPING CONTAINERS
echo ========================================
echo.

echo Stopping all containers...
docker-compose down
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.quick.yml down

echo.
echo ========================================
echo CONTAINERS STOPPED
echo ========================================
echo.
pause

