@echo off
chcp 65001 >nul
echo ========================================
echo ЗАПУСК ТОЛЬКО API
echo ========================================

echo.
echo 1. Переходим в папку API...
cd apps\api

echo.
echo 2. Устанавливаем зависимости...
npm install --legacy-peer-deps

echo.
echo 3. Собираем API...
npm run build

echo.
echo 4. Запускаем API...
npm run start:dev

echo.
echo ========================================
echo API запущен на http://localhost:3001
echo ========================================
pause
