@echo off
echo Committing and pushing changes to GitHub...
echo.

echo Checking git status:
git status

echo.
echo Adding all changes:
git add .

echo.
echo Committing changes:
git commit -m "Fix TypeScript errors in API build

- Fix DuctItem and Vehicle type errors in @ApiResponse decorators
- Replace @ventprom/core and @ventprom/parsers imports with relative paths
- Remove obsolete version from docker-compose.yml
- Add Docker run scripts for easier container management
- All TypeScript compilation errors resolved"

echo.
echo Pushing to GitHub:
git push origin main

echo.
echo Done! Check GitHub repository for updates.
echo.
pause
