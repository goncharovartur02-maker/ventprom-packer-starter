@echo off
chcp 65001 >nul
echo ========================================
echo ФИНАЛЬНЫЙ PUSH
echo ========================================

echo.
echo 1. Добавляем изменения...
git add .

echo.
echo 2. Коммитим исправления...
git commit -m "Fix: API parser initialization, added direct start scripts"

echo.
echo 3. Пушим в GitHub...
git push origin main

echo.
echo ========================================
echo ГОТОВО!
echo ========================================
echo.
echo Теперь запустите START_ALL.bat
echo ========================================
pause
