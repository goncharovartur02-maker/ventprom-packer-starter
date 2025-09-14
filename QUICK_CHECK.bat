@echo off
chcp 65001
echo Быстрая проверка системы...

echo.
echo Проверка API:
curl -s http://localhost:3001/api/health 2>nul
if %errorlevel% equ 0 (
    echo ✅ API работает
) else (
    echo ❌ API не запущен
)

echo.
echo Проверка Web:
curl -s -I http://localhost:3000 2>nul | find "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Web работает
) else (
    echo ❌ Web не запущен
)

echo.
echo Проверка процессов Node.js:
tasklist | find "node.exe" >nul
if %errorlevel% equ 0 (
    echo ✅ Node.js процессы запущены
    tasklist | find "node.exe"
) else (
    echo ❌ Node.js процессы не найдены
)

pause
