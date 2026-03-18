@echo off
REM ============================================================
REM FieldPulse Docker Deployment Script (Windows)
REM Production-ready deployment automation
REM ============================================================

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

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
REM Check Docker
REM ============================================================
:check_docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed!
    echo Please install Docker Desktop from https://docs.docker.com/get-docker/
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    exit /b 1
)

echo [OK] Docker is running
exit /b 0

REM ============================================================
REM Check Docker Compose
REM ============================================================
:check_docker_compose
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not available!
    echo Please install Docker Compose or update Docker Desktop.
    exit /b 1
)

echo [OK] Docker Compose is available
exit /b 0

REM ============================================================
REM Initial Deployment
REM ============================================================
:start
echo ========================================
echo   Initial Deployment
echo ========================================
echo.

call :check_docker
if %errorlevel% neq 0 exit /b 1

call :check_docker_compose
if %errorlevel% neq 0 exit /b 1

echo Building and starting FieldPulse...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo ERROR: Deployment failed!
    exit /b 1
)

echo.
echo [SUCCESS] Deployment complete!
echo.
echo Access the application at:
echo   Admin:  http://localhost:3000
echo   Agents: http://^<YOUR_IP^>:3000
echo.
echo View logs with: docker-deploy.bat logs
goto end

REM ============================================================
REM Update Deployment
REM ============================================================
:update
echo ========================================
echo   Updating Deployment
echo ========================================
echo.

call :check_docker
if %errorlevel% neq 0 exit /b 1

call :check_docker_compose
if %errorlevel% neq 0 exit /b 1

REM Check if git repository
if exist ".git" (
    echo Pulling latest changes from repository...
    
    REM Check for uncommitted changes
    git diff-index --quiet HEAD -- >nul 2>&1
    if %errorlevel% neq 0 (
        echo Stashing local changes...
        git stash
    )
    
    REM Pull latest changes
    git pull
    
    if %errorlevel% neq 0 (
        echo ERROR: Failed to pull changes
        exit /b 1
    )
    
    echo [OK] Code updated successfully
) else (
    echo Not a git repository, skipping pull...
)

echo Rebuilding Docker image...
docker compose build --no-cache

if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    exit /b 1
)

echo Restarting container with new image...
docker compose up -d

if %errorlevel% neq 0 (
    echo ERROR: Failed to start container!
    exit /b 1
)

echo Cleaning up old images...
docker image prune -f

echo.
echo [SUCCESS] Update complete!
echo.
echo Application is running at http://localhost:3000
echo View logs with: docker-deploy.bat logs
goto end

REM ============================================================
REM Stop Deployment
REM ============================================================
:stop
echo ========================================
echo   Stopping Deployment
echo ========================================
echo.

echo Stopping containers...
docker compose down

echo [OK] Containers stopped
goto end

REM ============================================================
REM Restart Deployment
REM ============================================================
:restart
echo ========================================
echo   Restarting Deployment
echo ========================================
echo.

echo Restarting containers...
docker compose restart

echo [OK] Containers restarted
goto end

REM ============================================================
REM View Logs
REM ============================================================
:logs
echo ========================================
echo   Container Logs
echo ========================================
echo.

docker compose logs -f --tail=100
goto end

REM ============================================================
REM Check Status
REM ============================================================
:status
echo ========================================
echo   Deployment Status
echo ========================================
echo.

docker compose ps

echo.
docker compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo [OK] FieldPulse is running
    echo.
    echo Access at: http://localhost:3000
) else (
    echo [ERROR] FieldPulse is not running
    echo.
    echo Start with: docker-deploy.bat start
)
goto end

REM ============================================================
REM Backup Data
REM ============================================================
:backup
echo ========================================
echo   Backing Up Data
echo ========================================
echo.

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_FILE=backup-%mydate%-%mytime%.json

echo Creating backup: %BACKUP_FILE%

docker compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    docker cp fieldpulse-server:/app/data/fieldpulse-data.json "./%BACKUP_FILE%" 2>nul
    if not exist "%BACKUP_FILE%" (
        docker cp fieldpulse-server:/app/fieldpulse-data.json "./%BACKUP_FILE%"
    )
    
    if exist "%BACKUP_FILE%" (
        echo [OK] Backup created: %BACKUP_FILE%
    ) else (
        echo [ERROR] Backup failed - container may not have data yet
    )
) else (
    echo [ERROR] Container is not running. Start it first with: docker-deploy.bat start
)
goto end

REM ============================================================
REM Help
REM ============================================================
:help
echo FieldPulse Docker Deployment Script
echo.
echo Usage: docker-deploy.bat [command]
echo.
echo Commands:
echo   start      - Initial deployment (build and start)
echo   update     - Pull changes from git and rebuild (USE THIS FOR UPDATES)
echo   stop       - Stop the containers
echo   restart    - Restart the containers
echo   logs       - View container logs
echo   status     - Check deployment status
echo   backup     - Backup application data
echo   help       - Show this help message
echo.
echo Examples:
echo   docker-deploy.bat start      # First time deployment
echo   docker-deploy.bat update     # Update after git pull
echo   docker-deploy.bat logs       # View logs
goto end

:end
endlocal
