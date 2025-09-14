@echo off
echo ========================================
echo FINAL SOLUTION - VentProm Packer
echo ========================================
echo.

echo This script will:
echo 1. Stop all containers
echo 2. Clean everything
echo 3. Rebuild from scratch
echo 4. Start containers
echo.

pause

echo STEP 1: Stopping all containers...
docker-compose down
docker system prune -f

echo.
echo STEP 2: Cleaning build artifacts...
if exist "apps\api\dist" rmdir /s /q "apps\api\dist"
if exist "apps\web\.next" rmdir /s /q "apps\web\.next"
if exist "packages\core\dist" rmdir /s /q "packages\core\dist"
if exist "packages\parsers\dist" rmdir /s /q "packages\parsers\dist"

echo.
echo STEP 3: Installing dependencies...
npm install --legacy-peer-deps

echo.
echo STEP 4: Building packages in order...
echo Building core...
cd packages\core
npm run build
cd ..\..

echo Building parsers...
cd packages\parsers
npm run build
cd ..\..

echo Building API...
cd apps\api
npm run build
cd ..\..

echo Building Web...
cd apps\web
npm run build
cd ..\..

echo.
echo STEP 5: Building Docker containers...
docker-compose build --no-cache

echo.
echo STEP 6: Starting containers...
docker-compose up -d

echo.
echo STEP 7: Checking status...
timeout /t 10
docker-compose ps

echo.
echo ========================================
echo FINAL SOLUTION COMPLETE
echo ========================================
echo.
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo.
echo If this doesn't work, the issue is deeper than build scripts.
echo.
pause

