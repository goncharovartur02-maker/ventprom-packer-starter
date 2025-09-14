@echo off
chcp 65001 >nul
echo ========================================
echo VENTPROM PACKER - ПРОСТОЙ ЗАПУСК
echo ========================================

echo.
echo 1. Останавливаем старые контейнеры...
docker-compose down

echo.
echo 2. Запускаем в development режиме с hot reload...
docker-compose -f docker-compose.dev.yml up --build -d

echo.
echo 3. Ждем запуска сервисов (30 секунд)...
timeout /t 30 /nobreak

echo.
echo 4. Проверяем статус...
docker ps

echo.
echo ========================================
echo ГОТОВО! Приложение запущено:
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo ========================================
echo.
echo Теперь можете:
echo 1. Открыть http://localhost:3000
echo 2. Загрузить PDF файл
echo 3. Увидеть результаты парсинга
echo.
echo Для остановки запустите STOP.bat
echo ========================================
pause