@echo off
chcp 65001
echo ========================================
echo VENTPROM PACKER - LOCAL START
echo ========================================
echo.

echo Установка зависимостей...
call npm install --legacy-peer-deps

echo.
echo Сборка core пакета...
cd packages\core
call npm run build
cd ..\..

echo.
echo Сборка parsers пакета...
cd packages\parsers
call npm run build
cd ..\..

echo.
echo Установка зависимостей API...
cd apps\api
call npm install --legacy-peer-deps
cd ..\..

echo.
echo Установка зависимостей Web...
cd apps\web
call npm install --legacy-peer-deps
cd ..\..

echo.
echo Запуск API сервера...
start "API Server" cmd /k "cd apps\api && npm run start:dev"

echo.
echo Ожидание запуска API...
timeout /t 10 /nobreak

echo.
echo Запуск Web сервера...
start "Web Server" cmd /k "cd apps\web && npm run dev"

echo.
echo ========================================
echo Система запущена локально!
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo ========================================
echo.
echo Нажмите любую клавишу для остановки...
pause > nul

echo.
echo Остановка серверов...
taskkill /f /im node.exe 2>nul
echo Готово!
pause
