@echo off
cd /d C:\Users\USER\wa-proxy
node server.js
if errorlevel 1 (
  echo.
  echo El proxy termino con error.
  pause
)
