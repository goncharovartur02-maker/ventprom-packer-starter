@echo off
echo 🚀 Upload to GitHub
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📋 Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed
    echo.
    echo 🔧 Please install Git:
    echo    1. Go to: https://git-scm.com/download/win
    echo    2. Download and install Git
    echo    3. Restart your computer
    echo    4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Git is installed

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
echo    2. Create a new repository named "ventprom-packer"
echo    3. Copy the repository URL
echo    4. Press Enter when ready
echo.
pause

echo.
echo 🔗 Adding remote origin...
echo Please enter your GitHub repository URL (e.g., https://github.com/username/ventprom-packer.git):
set /p REPO_URL=

git remote add origin %REPO_URL%

echo.
echo 🚀 Pushing to GitHub...
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



