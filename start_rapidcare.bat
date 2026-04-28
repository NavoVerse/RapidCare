@echo off
setlocal
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

title RapidCare Launcher

echo.
echo ══════════════════════════════════════════════
echo         RAPIDCARE SYSTEM INITIALIZER
echo ══════════════════════════════════════════════
echo.

:: 1. Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Cleanup Port 5000
echo [1/3] Checking if port 5000 is in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Port 5000 is in use by PID %%a. Terminating process...
    taskkill /F /PID %%a >nul 2>&1
)

:: 3. Run automatic setup (handles .env, npm install, migrations)
echo [2/3] Running environment setup...
cd "Backend"
call node scripts/setup.js
if %ERRORLEVEL% neq 0 (
    echo [!] Setup failed. Please check the errors above.
    pause
    exit /b 1
)

:: 4. Start Server
echo [3/3] Starting Unified Backend...
start "RapidCare Backend" cmd /k "node server.js"

:: Go back to root
cd /d "%ROOT_DIR%"

:: Open Frontend
echo.
echo Launching App Entry Point in 3 seconds...
timeout /t 3 >nul
start "" "http://localhost:5000"

echo.
echo ══════════════════════════════════════════════
echo   Unified backend running on http://localhost:5000
echo   Dev Dashboard: http://localhost:5000/dev
echo   Auth API:      http://localhost:5000/api/v1/auth
echo.
echo   NOTE: Keep the Backend window open while using
echo   the application.
echo ══════════════════════════════════════════════
echo.
pause
