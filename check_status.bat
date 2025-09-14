docker ps
echo.
echo Checking API logs:
docker compose -f docker-compose.dev.yml logs --tail=20 api
pause
