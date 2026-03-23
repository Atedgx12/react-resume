@echo off
REM Drop this file into shell:startup to auto-launch the analytics server on login
REM Or run: Start-Process shell:startup  then paste this .bat file there
start /min powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "b:\Resume\interactive-resume-project\react-resume\analytics-server\start-service.ps1"
