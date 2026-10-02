@echo off
rem Starts the local server and opens the site. Close this window to stop it.
cd /d "%~dp0"
start "" /b node serve.js
timeout /t 1 /nobreak >nul
start "" http://localhost:5173
echo.
echo  ONE PIECE ^| Luffy is running at http://localhost:5173
echo  Close this window to stop it.
echo.
pause >nul
