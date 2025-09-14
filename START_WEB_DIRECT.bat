@echo off
chcp 65001 >nul
echo ========================================
echo ЗАПУСК WEB НАПРЯМУЮ (БЕЗ DOCKER)
echo ========================================

echo.
echo 1. Переходим в папку Web...
cd apps\web

echo.
echo 2. Устанавливаем зависимости...
npm install --legacy-peer-deps

echo.
echo 3. Запускаем Web...
npm run dev

echo.
echo ========================================
echo Web запущен на http://localhost:3000
echo ========================================
pause
