@echo off
chcp 65001 >nul
echo ========================================
echo VENTPROM PACKER - ФИНАЛЬНАЯ СИСТЕМА
echo ========================================

echo.
echo 1. Останавливаем все контейнеры...
docker-compose down

echo.
echo 2. Очищаем Docker кэш...
docker system prune -f

echo.
echo 3. Запускаем в development режиме...
docker-compose -f docker-compose.dev.yml up --build -d

echo.
echo 4. Ждем запуска (60 секунд)...
timeout /t 60 /nobreak

echo.
echo 5. Проверяем статус контейнеров...
docker ps

echo.
echo 6. Тестируем API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/presets' -Method GET; Write-Host 'API работает! Статус:' $response.StatusCode } catch { Write-Host 'API не работает:' $_.Exception.Message }"

echo.
echo 7. Тестируем Web...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -Method GET; Write-Host 'Web работает! Статус:' $response.StatusCode } catch { Write-Host 'Web не работает:' $_.Exception.Message }"

echo.
echo ========================================
echo СИСТЕМА ЗАПУЩЕНА!
echo ========================================
echo.
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo.
echo Теперь можете:
echo 1. Открыть http://localhost:3000
echo 2. Загрузить PDF файл
echo 3. Увидеть результаты парсинга
echo.
echo Для остановки: STOP.bat
echo ========================================
pause
