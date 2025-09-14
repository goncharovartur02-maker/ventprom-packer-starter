@echo off
chcp 65001
echo ========================================
echo ПРОВЕРКА СТАТУСА СИСТЕМЫ
echo ========================================
echo.

echo Проверка API (http://localhost:3001/api/health)...
curl -s http://localhost:3001/api/health 2>nul
if %errorlevel% equ 0 (
    echo ✅ API работает
) else (
    echo ❌ API недоступен
)

echo.
echo Проверка Web (http://localhost:3000)...
curl -s -I http://localhost:3000 2>nul | find "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Web работает
) else (
    echo ❌ Web недоступен
)

echo.
echo Проверка presets API...
curl -s http://localhost:3001/presets 2>nul | find "Газель" >nul
if %errorlevel% equ 0 (
    echo ✅ Presets API работает
) else (
    echo ❌ Presets API недоступен
)

echo.
echo ========================================
echo Ссылки для тестирования:
echo Web приложение: http://localhost:3000
echo API Health: http://localhost:3001/api/health
echo API Presets: http://localhost:3001/presets
echo API Swagger: http://localhost:3001/api
echo ========================================
echo.
pause
