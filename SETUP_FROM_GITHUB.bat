@echo off
chcp 65001 >nul
echo ========================================
echo УСТАНОВКА ПРОЕКТА С GITHUB
echo ========================================

echo.
echo Этот скрипт поможет развернуть проект с GitHub
echo.

set /p REPO_URL="Введите URL вашего GitHub репозитория: "

echo.
echo 1. Клонируем репозиторий...
git clone %REPO_URL% ventprom-project
cd ventprom-project

echo.
echo 2. Создаем .env файл...
echo NEXT_PUBLIC_API_URL=http://localhost:3001 > .env

echo.
echo 3. Запускаем Docker Compose...
docker-compose -f docker-compose.github.yml up --build -d

echo.
echo 4. Ждем запуска сервисов (60 секунд)...
timeout /t 60 /nobreak

echo.
echo 5. Проверяем статус...
docker ps

echo.
echo ========================================
echo ГОТОВО!
echo ========================================
echo.
echo Система доступна:
echo - Web: http://localhost:3000
echo - API: http://localhost:3001
echo.
echo Hot Reload включен!
echo Редактируйте файлы в:
echo - apps/api/src/ - для API
echo - apps/web/src/ - для Web
echo.
echo Изменения применятся автоматически!
echo ========================================
pause
