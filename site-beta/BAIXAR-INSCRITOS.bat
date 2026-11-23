@echo off
rem Baixa a lista de inscritos do beta (PRODUCAO) e abre a pasta com o CSV. Dois cliques.
cd /d "%~dp0"
call npm run exportar -- --remote
if errorlevel 1 (echo. & echo Nao consegui baixar. Se pedir login, rode: npx wrangler login & pause & exit /b 1)
start "" "E:\Soulmon-marketing\inscritos"
pause
