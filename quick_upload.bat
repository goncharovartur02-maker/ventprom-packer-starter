@echo off
echo 🚀 Quick Upload to GitHub
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📋 This script will help you upload the code to GitHub
echo.
echo 📝 Steps:
echo    1. Install Git if not installed
echo    2. Create a new repository on GitHub
echo    3. Run this script
echo.
echo 🔧 Do you have Git installed? (y/n)
set /p HAS_GIT=

if /i "%HAS_GIT%"=="n" (
    echo.
    echo 📥 Please install Git first:
    echo    https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo.
echo 📁 Initializing Git repository...
git init

echo.
echo 📝 Adding all files...
git add .

echo.
echo 💾 Committing changes...
git commit -m "Initial commit: Ventprom Packer with Universal Parser"

echo.
echo 🌐 Please create a new repository on GitHub:
echo    1. Go to: https://github.com/new
echo    2. Repository name: ventprom-packer
echo    3. Make it public
echo    4. Don't initialize with README
echo    5. Copy the repository URL
echo.
echo 🔗 Enter your GitHub repository URL:
set /p REPO_URL=

echo.
echo 🔗 Adding remote origin...
git remote add origin %REPO_URL%

echo.
echo 🚀 Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ✅ Code uploaded to GitHub successfully!
echo.
echo 🐳 Now you can run in Docker:
echo    git clone %REPO_URL%
echo    cd ventprom-packer
echo    docker-compose up --build
echo.
pause

