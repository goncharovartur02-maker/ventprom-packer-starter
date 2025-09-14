@echo off
echo ========================================
echo DEVELOPMENT MODE - HOT RELOAD
echo ========================================
echo.

echo Starting development mode with hot reload...
echo Changes to code will be reflected immediately!
echo.

docker-compose -f docker-compose.dev.yml up --build

echo.
echo ========================================
echo DEVELOPMENT MODE COMPLETE
echo ========================================
echo.
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo.
echo Changes to code will be reflected immediately!
echo.
pause

