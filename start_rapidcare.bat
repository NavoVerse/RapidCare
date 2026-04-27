@echo off
setlocal
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo.
echo ==================================================
echo         RAPIDCARE SYSTEM INITIALIZER
echo ==================================================
echo.

:: Check for port 5000 and kill if necessary
echo [1/3] Checking if port 5000 is in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Port 5000 is in use by PID %%a. Terminating process...
    taskkill /F /PID %%a >nul 2>&1
)

:: Ensure .env exists
if not exist "Backend\.env" (
    echo [!] .env file missing in Backend directory.
    echo Creating default .env from .env.example...
    copy "Backend\.env.example" "Backend\.env" >nul
)

:: Start Unified Backend
echo [2/3] Starting Unified Backend (Port 5000)...
cd "Backend"
:: Use cmd /k so the window stays open on error
start "RapidCare Backend" cmd /k "node server.js"
cd /d "%ROOT_DIR%"

:: Open Frontend
echo [3/3] Launching App Entry Point...
timeout /t 3 >nul
start "" "choose_User\index.html"

echo.
echo ==================================================
echo   Unified backend running on http://localhost:5000
echo   Dev Dashboard: http://localhost:5000/dev
echo   Auth API:      http://localhost:5000/api/v1/auth
echo.
echo   NOTE: The backend runs in a separate window.
echo   Keep it open while using the application.
echo ==================================================
echo.
pause

