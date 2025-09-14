@echo off
echo ========================================
echo QUICK START - FIXED PARSERS
echo ========================================
echo.

echo Building and starting with fixed parsers...
docker-compose -f docker-compose.quick.yml up --build

echo.
echo ========================================
echo QUICK START COMPLETE
echo ========================================
echo.
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo.
pause
