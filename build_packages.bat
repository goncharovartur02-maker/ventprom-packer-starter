@echo off
echo 🔨 Building packages...
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

echo 📦 Building @ventprom/core...
cd packages\core
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build @ventprom/core
    pause
    exit /b 1
)
echo ✅ @ventprom/core built successfully

echo.
echo 📦 Building @ventprom/parsers...
cd ..\parsers
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build @ventprom/parsers
    pause
    exit /b 1
)
echo ✅ @ventprom/parsers built successfully

echo.
echo 🎉 All packages built successfully!
echo.
echo 📁 Checking dist folders...
cd ..\..
if exist "packages\core\dist" (
    echo ✅ packages\core\dist exists
) else (
    echo ❌ packages\core\dist missing
)

if exist "packages\parsers\dist" (
    echo ✅ packages\parsers\dist exists
) else (
    echo ❌ packages\parsers\dist missing
)

echo.
echo 🚀 Now you can run:
echo    npm run dev
echo.
pause
