@echo off
chcp 65001 >nul
echo Git Commands for VentProm Packer
echo.

echo 1. Checking git status:
git status
echo.

echo 2. Adding all changes:
git add .
echo.

echo 3. Committing changes:
git commit -m "Fix TypeScript errors and Docker setup

- Fix DuctItem and Vehicle type errors in API controllers
- Replace workspace imports with relative paths
- Remove obsolete docker-compose version
- Add Docker run scripts
- All TypeScript compilation errors resolved"

echo.

echo 4. Checking remotes:
git remote -v
echo.

echo 5. Pushing to GitHub:
git push origin main
echo.

echo Done! Check your GitHub repository.
echo.
pause
