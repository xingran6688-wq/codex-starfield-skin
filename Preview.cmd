@echo off
setlocal
cd /d "%~dp0"
node scripts\skin.mjs preview --out dist\preview.html
if errorlevel 1 (
  pause
  exit /b 1
)
start "Starfield Preview" "%~dp0dist\preview.html"
