@echo off
setlocal
cd /d "%~dp0"
echo Stop any Starfield watch terminal before restoring.
node scripts\skin.mjs restore
pause
