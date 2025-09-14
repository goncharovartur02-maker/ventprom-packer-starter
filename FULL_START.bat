@echo off
chcp 65001 >nul
echo ========================================
echo ПОЛНЫЙ ЗАПУСК СИСТЕМЫ VENTPROM PACKER
echo ========================================

echo.
echo 1. Останавливаем старые контейнеры...
docker-compose down

echo.
echo 2. Очищаем Docker систему...
docker system prune -f

echo.
echo 3. Запускаем сборку и старт контейнеров...
docker-compose -f docker-compose.dev.yml up --build -d

echo.
echo 4. Ждем полной загрузки (60 секунд)...
timeout /t 60 /nobreak

echo.
echo 5. Проверяем статус контейнеров...
docker ps

echo.
echo ========================================
echo СИСТЕМА ЗАПУЩЕНА!
echo ========================================
echo.
echo Откройте в браузере:
echo - Web интерфейс: http://localhost:3000
echo - API документация: http://localhost:3001/api
echo.
echo Для загрузки файлов:
echo 1. Откройте http://localhost:3000
echo 2. Загрузите PDF или Excel файл
echo 3. Выберите транспорт
echo 4. Нажмите "Pack Items"
echo 5. Смотрите 3D визуализацию
echo.
echo Для остановки запустите STOP.bat
echo ========================================
pause
