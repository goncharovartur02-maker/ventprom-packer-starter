@echo off
chcp 65001 >nul
echo ========================================
echo PUSH ИСПРАВЛЕНИЯ В GITHUB
echo ========================================

echo.
echo 1. Добавляем изменения...
git add .

echo.
echo 2. Коммитим исправления...
git commit -m "Fix: API dependencies, parser imports, removed test files"

echo.
echo 3. Пушим в GitHub...
git push origin main

echo.
echo ========================================
echo ИСПРАВЛЕНИЯ ОТПРАВЛЕНЫ!
echo ========================================
pause
