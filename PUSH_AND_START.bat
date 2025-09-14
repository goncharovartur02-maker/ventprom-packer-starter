@echo off
chcp 65001 >nul
echo ========================================
echo ФИНАЛЬНЫЙ PUSH И ЗАПУСК
echo ========================================

echo.
echo 1. Добавляем все изменения...
git add .

echo.
echo 2. Коммитим...
git commit -m "Final fix: Real parsers, 3D packing, full system working"

echo.
echo 3. Пушим в GitHub...
git push origin main

echo.
echo 4. Ждем немного...
timeout /t 5 /nobreak

echo.
echo 5. Запускаем систему...
call FULL_START.bat
