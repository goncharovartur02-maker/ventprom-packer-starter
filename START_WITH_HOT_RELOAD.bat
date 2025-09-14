@echo off
chcp 65001 >nul
echo ========================================
echo ЗАПУСК С HOT RELOAD
echo ========================================

echo.
echo 1. Останавливаем старые контейнеры...
docker-compose down

echo.
echo 2. Запускаем с hot reload...
docker-compose -f docker-compose.github.yml up --build

echo.
echo ========================================
echo Система запущена с Hot Reload!
echo ========================================
echo.
echo Ctrl+C для остановки
echo ========================================
