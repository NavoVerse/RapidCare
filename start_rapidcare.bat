@echo off
setlocal
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

title RapidCare Launcher

echo.
echo ==================================================
echo         RAPIDCARE SYSTEM INITIALIZER
echo ==================================================
echo.

<<<<<<< HEAD
:: Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for port 5000 and kill if necessary
=======
:: 1. Cleanup Port 5000
>>>>>>> 5c8f305862f4291707758baf3a60c7492a193c73
echo [1/4] Checking if port 5000 is in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Port 5000 is in use by PID %%a. Terminating process...
    taskkill /F /PID %%a >nul 2>&1
)

:: 2. Setup Backend
echo [2/4] Setting up Backend...
cd "Backend"

if not exist ".env" (
    echo [!] .env file missing. Creating from example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
    ) else (
        echo PORT=5000 > .env
        echo JWT_SECRET=rapidcare_secret_2026 >> .env
        echo NODE_ENV=development >> .env
    )
)

<<<<<<< HEAD
:: Check dependencies
echo [2/4] Verifying backend dependencies...
cd "Backend"
if not exist "node_modules\" (
    echo [!] node_modules missing. Running npm install...
    call npm install
)

:: Start Unified Backend
echo [3/4] Starting Unified Backend (Port 5000)...
:: Use cmd /k so the window stays open on error
=======
if not exist "node_modules" (
    echo [!] node_modules missing. Installing dependencies...
    call npm install
)

:: 3. Run Database Migrations
echo [3/4] Ensuring database is up to date...
call npx knex migrate:latest

:: 4. Start Server
echo [4/4] Starting Unified Backend...
>>>>>>> 5c8f305862f4291707758baf3a60c7492a193c73
start "RapidCare Backend" cmd /k "node server.js"

:: Go back to root
cd /d "%ROOT_DIR%"

:: Open Frontend
<<<<<<< HEAD
echo [4/4] Launching App Entry Point...
=======
echo.
echo Launching App Entry Point in 3 seconds...
>>>>>>> 5c8f305862f4291707758baf3a60c7492a193c73
timeout /t 3 >nul
start "" "choose_User\index.html"

echo.
echo ==================================================
echo   Unified backend running on http://localhost:5000
echo   Dev Dashboard: http://localhost:5000/dev
echo   Auth API:      http://localhost:5000/api/v1/auth
echo.
echo   NOTE: Keep the Backend window open while using
echo   the application.
echo ==================================================
echo.
pause
<<<<<<< HEAD


=======
>>>>>>> 5c8f305862f4291707758baf3a60c7492a193c73
