@echo off
title NexCampus College Super App
echo ========================================================
echo    NexCampus AI-Powered College Super App & Website
echo ========================================================
echo Starting server and opening website in default browser...
timeout /t 2 /nobreak >nul
start "" http://localhost:5005/
node backend/server.js
pause

