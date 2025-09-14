@echo off
chcp 65001 >nul
echo ========================================
echo ИНИЦИАЛИЗАЦИЯ GIT РЕПОЗИТОРИЯ
echo ========================================

echo.
echo 1. Инициализируем Git репозиторий...
git init

echo.
echo 2. Добавляем все файлы...
git add .

echo.
echo 3. Делаем первый коммит...
git commit -m "Initial commit: VentProm Packer system"

echo.
echo 4. Настраиваем ветку main...
git branch -M main

echo.
echo ========================================
echo GIT РЕПОЗИТОРИЙ ГОТОВ!
echo ========================================
echo.
echo Теперь можете:
echo 1. Создать репозиторий на GitHub
echo 2. Добавить remote: git remote add origin YOUR_REPO_URL
echo 3. Запушить: git push -u origin main
echo.
echo После этого можете использовать PUSH_AND_DEPLOY.bat
echo для автоматического деплоя при изменениях.
echo ========================================
pause
