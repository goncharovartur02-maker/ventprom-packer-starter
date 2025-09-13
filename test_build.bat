@echo off
echo Testing build process...
echo.

echo Current directory: %CD%
echo.

echo Checking if TypeScript is available:
where tsc
echo.

echo Checking if npm is available:
where npm
echo.

echo Trying to build core package manually:
cd packages\core
echo Current directory: %CD%
echo.

echo Running: npx tsc
npx tsc
echo Exit code: %errorlevel%
echo.

echo Checking if dist folder was created:
if exist "dist" (
    echo SUCCESS: dist folder created!
    dir dist
) else (
    echo ERROR: dist folder not created
)

echo.
echo Going back to root...
cd ..\..

echo.
echo Press any key to continue...
pause

