@echo off
chcp 65001 >nul
echo ========================================
echo ФИНАЛЬНЫЙ PUSH В GITHUB
echo ========================================

echo.
echo 1. Инициализируем Git (если нужно)...
git init

echo.
echo 2. Добавляем все файлы...
git add .

echo.
echo 3. Коммитим изменения...
git commit -m "Final: Cleaned system, added rules, removed test files, ready for production"

echo.
echo 4. Настраиваем ветку main...
git branch -M main

echo.
echo 5. Пушим в репозиторий...
git push -u origin main

echo.
echo ========================================
echo ГОТОВО! СИСТЕМА ОТПРАВЛЕНА В GITHUB!
echo ========================================
echo.
echo Теперь можете:
echo 1. Запустить FINAL_SYSTEM.bat
echo 2. Открыть http://localhost:3000
echo 3. Протестировать загрузку файлов
echo ========================================
pause
