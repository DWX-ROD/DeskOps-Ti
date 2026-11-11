@echo off
chcp 65001 > nul
title DeskOps TI - Helpdesk e Inventario
color 0B
cls

echo =====================================================================
echo           DESKOPS TI - HELPDESK ^& INVENTARIO GOOGLE WORKSPACE
echo =====================================================================
echo.
echo  Iniciando o sistema localmente no seu computador...
echo.

:: 1. Verificar se o Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] O Node.js nao foi encontrado no seu computador!
    echo.
    echo Para executar o DeskOps TI, voce precisa ter o Node.js instalado (versao 18 ou superior).
    echo Baixe gratuitamente em: https://nodejs.org
    echo.
    echo Apos instalar, execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

echo [1/3] Node.js detectado com sucesso:
node -v
echo.

:: 2. Instalar dependencias se a pasta node_modules nao existir
if not exist "node_modules\" (
    echo [2/3] Instalando dependencias do sistema pela primeira vez (npm install)...
    echo Isso pode levar de 30 a 60 segundos...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERRO] Falha ao instalar dependencias. Verifique sua conexao com a internet.
        pause
        exit /b 1
    )
    echo [2/3] Dependencias instaladas com sucesso!
) else (
    echo [2/3] Dependencias ja instaladas.
)
echo.

:: 3. Iniciar o servidor e abrir o navegador automaticamente
echo [3/3] Iniciando o servidor DeskOps TI em http://localhost:3000...
echo.
echo  * DICA: No navegador, clique em "Instalar Aplicativo" para criar
echo    um atalho executavel (.exe) na sua Area de Trabalho!
echo.
echo  Para encerrar o sistema, feche esta janela ou pressione CTRL + C.
echo =====================================================================
echo.

:: Abre o navegador em segundo plano apos 3 segundos
start /b "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Executa o Vite Dev Server
npm run dev
