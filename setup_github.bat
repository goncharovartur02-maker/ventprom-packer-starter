@echo off
chcp 65001 >nul
echo Setting up GitHub remote for VentProm Packer
echo.

echo Current remotes:
git remote -v
echo.

echo If you need to add a GitHub remote, run:
echo git remote add origin https://github.com/YOUR_USERNAME/ventprom-packer-starter.git
echo.

echo Or if you want to change the existing remote:
echo git remote set-url origin https://github.com/YOUR_USERNAME/ventprom-packer-starter.git
echo.

echo Replace YOUR_USERNAME with your actual GitHub username.
echo.

echo After setting up the remote, you can run:
echo git push -u origin main
echo.

pause
