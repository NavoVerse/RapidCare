@echo off
setlocal
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo.
echo ==================================================
echo         RAPIDCARE SYSTEM INITIALIZER
echo ==================================================
echo.

:: Start Unified Backend (Auth + Dev Dashboard on Port 5000)
echo [1/2] Starting Unified Backend (Port 5000)...
cd "Backend"
start "RapidCare Backend" cmd /c "node server.js"
cd /d "%ROOT_DIR%"

:: Open Frontend
echo [2/2] Launching App Entry Point...
timeout /t 2 >nul
start "" "choose_User\index.html"

echo.
echo ==================================================
echo   Unified backend running on http://localhost:5000
echo   Dev Dashboard: http://localhost:5000/dev
echo   Auth API:      http://localhost:5000/api/auth
echo.
echo   Close the backend terminal window to stop.
echo ==================================================
echo.
pause
