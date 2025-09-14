@echo off
chcp 65001 >nul
echo ========================================
echo ЗАПУСК ВСЕЙ СИСТЕМЫ
echo ========================================

echo.
echo 1. Запускаем API в фоне...
start "API" cmd /k "cd apps\api && npm install --legacy-peer-deps && npm run build && npm run start:dev"

echo.
echo 2. Ждем запуска API (30 секунд)...
timeout /t 30 /nobreak

echo.
echo 3. Запускаем Web в фоне...
start "Web" cmd /k "cd apps\web && npm install --legacy-peer-deps && npm run dev"

echo.
echo 4. Ждем запуска Web (30 секунд)...
timeout /t 30 /nobreak

echo.
echo ========================================
echo СИСТЕМА ЗАПУЩЕНА!
echo ========================================
echo.
echo API: http://localhost:3001
echo Web: http://localhost:3000
echo.
echo Откройте http://localhost:3000 и протестируйте
echo ========================================
pause
