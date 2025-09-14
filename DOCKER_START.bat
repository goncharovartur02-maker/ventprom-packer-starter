@echo off
chcp 65001 > nul
echo ========================================
echo VENTPROM PACKER - DOCKER START
echo ========================================
echo.

echo Остановка старых контейнеров...
docker-compose -f docker-compose.dev.yml down

echo.
echo Сборка и запуск контейнеров...
docker-compose -f docker-compose.dev.yml up --build -d

echo.
echo Проверка статуса...
timeout /t 10 /nobreak > nul
docker-compose -f docker-compose.dev.yml ps

echo.
echo Проверка логов API...
echo ========================================
docker-compose -f docker-compose.dev.yml logs api --tail 20

echo.
echo Проверка логов Web...
echo ========================================
docker-compose -f docker-compose.dev.yml logs web --tail 20

echo.
echo ========================================
echo Система запущена!
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo API Health: http://localhost:3001/api/health
echo ========================================
echo.
pause
