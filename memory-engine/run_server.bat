@echo off
setlocal
rem Compatibility entry point. Spring uses the engine under backend/memory-engine.
call "%~dp0..\backend\memory-engine\run_server.bat" %*
exit /b %errorlevel%
