@echo off
chcp 65001
echo ========================================
echo ПОЛНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ
echo ========================================
echo.

echo 1. Установка зависимостей...
call npm install --legacy-peer-deps

echo.
echo 2. Сборка core пакета...
cd packages\core
call npm install --legacy-peer-deps
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки core пакета!
    pause
    exit /b 1
)
echo ✅ Core пакет собран
cd ..\..

echo.
echo 3. Сборка parsers пакета...
cd packages\parsers
call npm install --legacy-peer-deps
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки parsers пакета!
    pause
    exit /b 1
)
echo ✅ Parsers пакет собран
cd ..\..

echo.
echo 4. Тестирование парсеров с реальными файлами...
node TEST_REAL_FILES.js

echo.
echo 5. Сборка API...
cd apps\api
call npm install --legacy-peer-deps
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки API!
    pause
    exit /b 1
)
echo ✅ API собран
cd ..\..

echo.
echo 6. Сборка Web...
cd apps\web
call npm install --legacy-peer-deps
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки Web!
    pause
    exit /b 1
)
echo ✅ Web собран
cd ..\..

echo.
echo 7. Запуск API сервера...
cd apps\api
start "API Server" cmd /k "npm run start:dev"
cd ..\..

echo.
echo 8. Ожидание запуска API...
timeout /t 15 /nobreak

echo.
echo 9. Тестирование API endpoints...
echo Тестирование /presets...
curl -s http://localhost:3001/presets | find "Газель" >nul
if %errorlevel% equ 0 (
    echo ✅ /presets работает
) else (
    echo ❌ /presets не работает
)

echo Тестирование /api/health...
curl -s http://localhost:3001/api/health | find "ok" >nul
if %errorlevel% equ 0 (
    echo ✅ /api/health работает
) else (
    echo ❌ /api/health не работает
)

echo.
echo 10. Тестирование парсера через API...
curl -X POST -F "files=@sample_files/example.xlsx" http://localhost:3001/parse > test_parse_result.json 2>nul
if %errorlevel% equ 0 (
    echo ✅ Parse API работает
    type test_parse_result.json | find "items" >nul
    if %errorlevel% equ 0 (
        echo ✅ Parse возвращает items
    ) else (
        echo ❌ Parse не возвращает items
    )
) else (
    echo ❌ Parse API не работает
)

echo.
echo 11. Тестирование упаковки через API...
echo {"vehicle":{"id":"gazelle","name":"Газель","width":2000,"height":1800,"length":3000,"maxPayloadKg":1500},"items":[{"id":"test1","type":"rect","w":200,"h":100,"length":1000,"qty":2,"weightKg":15,"flangeType":"TDC","material":"galvanized"}]} > test_pack_request.json

curl -X POST -H "Content-Type: application/json" -d @test_pack_request.json http://localhost:3001/pack > test_pack_result.json 2>nul
if %errorlevel% equ 0 (
    echo ✅ Pack API работает
    type test_pack_result.json | find "success" >nul
    if %errorlevel% equ 0 (
        echo ✅ Pack возвращает результат
    ) else (
        echo ❌ Pack не возвращает результат
    )
) else (
    echo ❌ Pack API не работает
)

echo.
echo 12. Запуск Web сервера...
cd apps\web
start "Web Server" cmd /k "npm run dev"
cd ..\..

echo.
echo 13. Ожидание запуска Web...
timeout /t 10 /nobreak

echo.
echo 14. Тестирование Web приложения...
curl -s -I http://localhost:3000 | find "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Web приложение работает
) else (
    echo ❌ Web приложение не работает
)

echo.
echo ========================================
echo РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ
echo ========================================
echo.
echo 🌐 Ссылки для проверки:
echo   • Web: http://localhost:3000
echo   • API: http://localhost:3001/api
echo   • Health: http://localhost:3001/api/health
echo   • Presets: http://localhost:3001/presets
echo.
echo 📁 Файлы результатов:
echo   • test_parse_result.json - результат парсинга
echo   • test_pack_result.json - результат упаковки
echo.
echo 🧪 Для тестирования загрузите файлы из папки examples/
echo.
pause

:: Очистка временных файлов
del test_parse_result.json 2>nul
del test_pack_result.json 2>nul
del test_pack_request.json 2>nul
