@echo off
chcp 65001 >nul
echo ========================================
echo HOTFIX - ИСПРАВЛЕНИЕ ПАРСЕРА
echo ========================================

echo.
echo 1. Добавляем изменения...
git add .

echo.
echo 2. Коммитим исправления...
git commit -m "Hotfix: Added simple parser without dependencies"

echo.
echo 3. Пушим в GitHub...
git push origin main

echo.
echo ========================================
echo ГОТОВО! ОБНОВИТЕ СТРАНИЦУ!
echo ========================================
echo.
echo Теперь API должен работать с простым парсером
echo Обновите страницу и протестируйте загрузку файлов
echo ========================================
pause
