@echo off
echo ========================================
echo    FieldPulse Marketing Visits App
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    echo Minimum version required: 16.0.0
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --production
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Build the web app if dist folder doesn't exist
if not exist "dist" (
    echo Building web application...
    npm run build:web
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build web application!
        pause
        exit /b 1
    )
)

echo.
echo Starting FieldPulse server...
echo.
echo Admin Dashboard: http://localhost:3000
echo Field Agents: Use your computer's IP address on port 3000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
node server.js

pause
