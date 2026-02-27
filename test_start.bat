@echo off
chcp 65001 >nul
title Manager Show - Starter Unificado

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║             MANAGER SHOW - AMBIENTE LOCAL                 ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM ============================================================
REM PASSO 1: Verificar e limpar portas Órfãs (8000 e 3000)
REM ============================================================
echo [1/5] Verificando portas 8000 e 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo [!] Processo na porta 8000 [PID: %%a]. Encerrando...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo [!] Processo na porta 3000 [PID: %%a]. Encerrando...
    taskkill /F /PID %%a >nul 2>&1
)
echo [V] Portas testadas e liberadas.

REM ============================================================
REM PASSO 2: Iniciar Motor Assincrono (Celery Broker)
REM ============================================================
echo.
echo [2/5] Iniciando Operario Assincrono (Celery Worker)...
start /B "Celery Worker" cmd /c ".venv\Scripts\celery.exe -A app.core.celery_app.celery_app worker -l info --pool=threads --concurrency=4"
timeout /t 2 /nobreak >nul

REM ============================================================
REM PASSO 3: Iniciar Motor Principal (FastAPI Web)
REM ============================================================
echo.
echo [3/5] Iniciando Backend API (FastAPI)...
start /B "FastAPI Backend" cmd /c ".venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --workers 4"
echo [*] Aguardando inicializacao dos clusters e conexao ao PostgreSQL e Redis...

REM ============================================================
REM PASSO 4: Teste de Conectividade (Healthcheck Automatizado)
REM ============================================================
echo.
echo [4/5] Aplicando Teste de Resiliencia (Health Check)...
set ATTEMPTS=0

:healthcheck
set /a ATTEMPTS+=1
powershell -ExecutionPolicy Bypass -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/health' -TimeoutSec 2; if ($response.status -eq 'healthy') { exit 0 } else { exit 1 } } catch { exit 1 }"
if %errorlevel% neq 0 (
    if %ATTEMPTS% GEQ 15 (
        echo [X] Erro Crítico: A API nao respondeu apos 30 segundos! 
        echo Controle as janelas de erro para verificar DB ou .env.
        pause
        exit /b 1
    )
    echo    ... Disparando probe de PING a API [Tentativa %ATTEMPTS%/15] ...
    timeout /t 2 /nobreak >nul
    goto healthcheck
)
echo [V] Backend online e Saudavel! O banco de dados e os brokers responderam perfeitamente.

REM ============================================================
REM PASSO 5: Iniciar Interface PWA (Next.js) e Acoplar Logs
REM ============================================================
echo.
echo [5/5] Subindo Frontend (PWA) e espelhando Múltiplos Logs...
echo.
echo ════════════════════════════════════════════════════════════
echo   [SERVER ACTIVED] Manager Show Horizon 1 (V0.6.0-Beta)
echo   [CONSOLE TRIPLE] FastAPI + Celery + Frontend na mesma Output 
echo   Para derrubar todos os microsserviços pressione CTRL+C
echo.
echo   - Operacao App: http://localhost:3000
echo   - API Vault:    http://localhost:8000/docs
echo ════════════════════════════════════════════════════════════
echo.

cd frontend
npm run dev
