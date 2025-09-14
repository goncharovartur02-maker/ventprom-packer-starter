@echo off
chcp 65001 >nul
echo ========================================
echo GIT PUSH И АВТО-ДЕПЛОЙ
echo ========================================

echo.
echo 1. Добавляем все изменения в Git...
git add .

echo.
echo 2. Коммитим изменения...
git commit -m "Auto-update: $(date /t) $(time /t)"

echo.
echo 3. Пушим в репозиторий...
git push origin main

echo.
echo 4. Ждем деплоя (60 секунд)...
timeout /t 60 /nobreak

echo.
echo 5. Тестируем систему...
node auto_test.js

echo.
echo ========================================
echo ДЕПЛОЙ ЗАВЕРШЕН!
echo ========================================
echo.
echo Если все тесты прошли, можете обновить страницу
echo и проверить работоспособность.
echo ========================================
pause
