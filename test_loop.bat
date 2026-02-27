for /f "tokens=5" %%%%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (  ; echo echo Processo 8000 [PID: %%%%a].  ; echo taskkill /F /PID %%%%a >nul 2>&1  ; echo )  ; test_loop.bat
