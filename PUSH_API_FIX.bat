@echo off
chcp 65001 >nul
echo ========================================
echo ИСПРАВЛЕНИЕ API
echo ========================================

echo.
echo 1. Добавляем изменения...
git add .

echo.
echo 2. Коммитим исправления...
git commit -m "Fix: Added API startup script"

echo.
echo 3. Пушим в GitHub...
git push origin main

echo.
echo ========================================
echo ГОТОВО!
echo ========================================
echo.
echo Теперь запустите START_API_ONLY.bat
echo для запуска API на localhost:3001
echo ========================================
pause
