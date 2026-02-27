@echo off
REM ===============================================================================
REM MANAGER SHOW - STARTER (Bridge para PowerShell)
REM 
REM Este script existe para compatibilidade com o comando ".\start.bat".
REM Toda a logica real de orquestracao e execucao assincrona esta no start.ps1
REM ===============================================================================

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0start.ps1"
exit /b %ERRORLEVEL%
