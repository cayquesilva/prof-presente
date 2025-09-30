@echo off
chcp 65001 >nul
title Sistema de Crachás Virtuais - Parar Serviços

echo.
echo ========================================
echo  Parando Sistema de Crachás Virtuais
echo ========================================
echo.

echo 🛑 Parando containers Docker...
docker-compose -f docker-compose.dev.yml down

if errorlevel 1 (
    echo ❌ Erro ao parar containers.
    echo    Verifique se o Docker Desktop está rodando.
) else (
    echo ✅ Containers parados com sucesso!
)

echo.
echo 📊 Status dos containers:
docker ps -a --filter "name=cracha_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 💡 Para remover completamente os dados do banco:
echo    execute: reset-db.bat
echo.
echo 🔄 Para iniciar novamente:
echo    execute: start-dev.bat
echo.
pause

