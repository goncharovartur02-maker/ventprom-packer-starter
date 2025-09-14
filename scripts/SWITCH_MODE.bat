@echo off
echo ========================================
echo SWITCH MODE
echo ========================================
echo.

echo Choose mode:
echo 1. Development Mode (Hot Reload) - for coding
echo 2. Production Mode (Fast) - for testing
echo.

set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto prod
goto end

:dev
echo Starting Development Mode...
call DEV_MODE.bat
goto end

:prod
echo Starting Production Mode...
call SIMPLE_DOCKER.bat
goto end

:end
echo.
pause

