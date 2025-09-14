@echo off
chcp 65001 >nul
echo ========================================
echo GIT PUSH - ОБНОВЛЕНИЕ РЕПОЗИТОРИЯ
echo ========================================

echo.
echo 1. Добавляем все изменения...
git add .

echo.
echo 2. Коммитим изменения...
git commit -m "Fix: Cleaned up system, added rules, improved testing"

echo.
echo 3. Пушим в репозиторий...
git push origin main

echo.
echo ========================================
echo ИЗМЕНЕНИЯ ОТПРАВЛЕНЫ В GITHUB!
echo ========================================
pause
