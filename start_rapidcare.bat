@echo off
setlocal
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo.
echo ==================================================
echo         RAPIDCARE SYSTEM INITIALIZER
echo ==================================================
echo.

:: Start Auth Backend
echo [1/3] Starting Auth Backend (Port 5000)...
cd "Backend\user_Registration_Login_System"
start "RapidCare Auth Backend" cmd /c "node server.js"
cd /d "%ROOT_DIR%"

:: Start Developer Dashboard
echo [2/3] Starting Developer Dashboard (Port 3000)...
cd "DeveloperDashboard"
start "RapidCare Dev Dashboard" cmd /c "node server.js"
cd /d "%ROOT_DIR%"

:: Open Frontend
echo [3/3] Launching App Entry Point...
timeout /t 2 >nul
start "" "choose_User\index.html"

echo.
echo ==================================================
echo   System running. Close the terminal windows
echo   to stop the servers.
echo ==================================================
echo.
pause
