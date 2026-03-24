@echo off
REM ============================================================
REM FieldPulse Marketing App - Docker Deployment Script (Windows)
REM Auto-restart enabled | 24/7 production deployment
REM ============================================================

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

set APP_NAME=fieldpulse-marketing
set CONTAINER_NAME=fieldpulse-marketing

REM Main command dispatcher
if "%1"=="" goto help
if /i "%1"=="start" goto start
if /i "%1"=="update" goto update
if /i "%1"=="stop" goto stop
if /i "%1"=="restart" goto restart
if /i "%1"=="logs" goto logs
if /i "%1"=="status" goto status
if /i "%1"=="backup" goto backup
if /i "%1"=="help" goto help
if /i "%1"=="-h" goto help
if /i "%1"=="--help" goto help

echo Unknown command: %1
echo.
goto help

REM ============================================================
REM Preflight Checks
REM ============================================================
:check_prerequisites
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed! Install from https://docs.docker.com/get-docker/
    exit /b 1
)
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running! Start Docker Desktop and try again.
    exit /b 1
)
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose not available! Update Docker Desktop.
    exit /b 1
)
echo [OK] Docker ^& Compose ready
exit /b 0

REM ============================================================
REM COMMAND: start - First-time deployment
REM ============================================================
:start
echo.
echo ======================================
echo   First-Time Deployment
echo ======================================
echo.

call :check_prerequisites
if %errorlevel% neq 0 exit /b 1

echo Building image and starting container...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo [ERROR] Deployment failed!
    exit /b 1
)

echo.
echo [OK] Deployment complete! Container will auto-restart 24/7.
echo.
echo   Admin:  http://localhost:3000
echo   Agents: http://^<YOUR_IP^>:3000
echo.
echo   Logs:   docker-deploy.bat logs
echo   Status: docker-deploy.bat status
goto end

REM ============================================================
REM COMMAND: update - Pull from GitHub + rebuild
REM ============================================================
:update
echo.
echo ======================================
echo   Update from GitHub
echo ======================================
echo.

call :check_prerequisites
if %errorlevel% neq 0 exit /b 1

if not exist ".git" (
    echo [ERROR] Not a git repository. Clone the repo first.
    exit /b 1
)

echo Pulling latest changes...

REM Stash local changes if any
git diff-index --quiet HEAD -- >nul 2>&1
if %errorlevel% neq 0 (
    echo Stashing local changes...
    git stash
)

git pull
if %errorlevel% neq 0 (
    echo [ERROR] git pull failed
    exit /b 1
)
echo [OK] Code pulled successfully

echo Rebuilding image (no cache)...
docker compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    exit /b 1
)

echo Restarting with new image...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start container!
    exit /b 1
)

echo Cleaning up old images...
docker image prune -f

echo.
echo [OK] Update complete! Running at http://localhost:3000
goto end

REM ============================================================
REM COMMAND: stop
REM ============================================================
:stop
echo.
echo Stopping containers...
docker compose down
echo [OK] Stopped
goto end

REM ============================================================
REM COMMAND: restart
REM ============================================================
:restart
echo.
echo Restarting containers...
docker compose restart
echo [OK] Restarted
goto end

REM ============================================================
REM COMMAND: logs
REM ============================================================
:logs
docker compose logs -f --tail=100
goto end

REM ============================================================
REM COMMAND: status
REM ============================================================
:status
echo.
echo ======================================
echo   Deployment Status
echo ======================================
echo.
docker compose ps
echo.

docker compose ps | findstr /i "Up running" >nul
if %errorlevel% equ 0 (
    echo [OK] %APP_NAME% is running (auto-restart: always)
    echo.
    echo   URL: http://localhost:3000
) else (
    echo [ERROR] %APP_NAME% is NOT running
    echo   Start with: docker-deploy.bat start
)
goto end

REM ============================================================
REM COMMAND: backup
REM ============================================================
:backup
echo.
echo ======================================
echo   Backing Up Data
echo ======================================
echo.

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_FILE=backup-%mydate%-%mytime%.json

echo Creating backup: %BACKUP_FILE%

docker compose ps | findstr /i "Up running" >nul
if %errorlevel% equ 0 (
    docker cp %CONTAINER_NAME%:/app/data/fieldpulse-data.json "./%BACKUP_FILE%" 2>nul
    if not exist "%BACKUP_FILE%" (
        docker cp %CONTAINER_NAME%:/app/fieldpulse-data.json "./%BACKUP_FILE%"
    )

    if exist "%BACKUP_FILE%" (
        echo [OK] Backup saved: %BACKUP_FILE%
    ) else (
        echo [ERROR] No data file found in container yet
    )
) else (
    echo [ERROR] Container not running. Start first: docker-deploy.bat start
)
goto end

REM ============================================================
REM COMMAND: help
REM ============================================================
:help
echo.
echo   FieldPulse Marketing App - Docker Deploy (Windows)
echo.
echo   Usage: docker-deploy.bat ^<command^>
echo.
echo   Commands:
echo     start     First-time build ^& deploy (auto-restart enabled)
echo     update    Pull latest from GitHub, rebuild ^& restart
echo     stop      Stop containers
echo     restart   Restart containers
echo     logs      Tail container logs
echo     status    Show running status
echo     backup    Export data file from container
echo     help      Show this message
echo.
echo   Typical workflow:
echo     1. First deploy:   docker-deploy.bat start
echo     2. After git push: docker-deploy.bat update
echo.
goto end

:end
endlocal
