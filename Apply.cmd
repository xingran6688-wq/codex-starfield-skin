@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required. Install it from nodejs.org.
  pause
  exit /b 1
)
node scripts\skin.mjs doctor
if errorlevel 1 (
  echo Diagnosis failed. No wallpaper was applied. See the error above.
  pause
  exit /b 1
)
node scripts\skin.mjs apply
pause
