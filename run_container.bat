@echo off
echo Starting VentProm Packer container...
echo.

echo Available images:
docker images
echo.

echo Running containers:
docker ps -a
echo.

echo Starting the application container...
docker run -d -p 3000:3000 -p 3001:3001 --name ventprom-app ventprom-packer:dev

echo.
echo Container started! Check status:
docker ps

echo.
echo To view logs:
echo docker logs ventprom-app

echo.
echo To stop container:
echo docker stop ventprom-app

echo.
echo To remove container:
echo docker rm ventprom-app

echo.
echo Press any key to continue...
pause
