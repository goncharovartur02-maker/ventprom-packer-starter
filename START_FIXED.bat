@echo off
chcp 65001 >nul
echo ========================================
echo ЗАПУСК ИСПРАВЛЕННОЙ СИСТЕМЫ
echo ========================================

echo.
echo 1. Останавливаем все контейнеры...
docker-compose down

echo.
echo 2. Устанавливаем зависимости API...
cd apps\api
npm install --legacy-peer-deps
cd ..\..

echo.
echo 3. Собираем API...
cd apps\api
npm run build
cd ..\..

echo.
echo 4. Запускаем систему...
docker-compose -f docker-compose.dev.yml up --build -d

echo.
echo 5. Ждем запуска (60 секунд)...
timeout /t 60 /nobreak

echo.
echo 6. Проверяем контейнеры...
docker ps

echo.
echo ========================================
echo СИСТЕМА ЗАПУЩЕНА!
echo ========================================
echo.
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo.
echo Теперь можете протестировать загрузку файлов
echo ========================================
pause
