@echo off
chcp 65001 >nul
title Sistema de Crachás Virtuais - Desenvolvimento

echo.
echo ========================================
echo  Sistema de Crachás Virtuais - Dev
echo ========================================
echo.

echo [1/5] Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Docker não encontrado. 
    echo    Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)
echo ✅ Docker encontrado

echo.
echo [2/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js não encontrado.
    echo    Instale o Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

echo.
echo [3/5] Iniciando banco de dados PostgreSQL...
docker-compose -f ../docker-compose.dev.yml up -d postgres-dev
if errorlevel 1 (
    echo ❌ ERRO: Falha ao iniciar o banco de dados.
    echo    Verifique se o Docker Desktop está rodando.
    echo.
    pause
    exit /b 1
)

echo.
echo [4/5] Aguardando banco de dados ficar pronto...
timeout /t 15 /nobreak >nul

echo.
echo [5/5] Verificando conexão com banco...
docker exec cracha_postgres_dev pg_isready -U cracha_user -d cracha_virtual_dev >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Banco de dados não está respondendo.
    echo    Aguarde mais alguns segundos e tente novamente.
    echo.
    echo    Para verificar logs: docker logs cracha_postgres_dev
    echo.
    pause
    exit /b 1
)

echo ✅ Banco de dados iniciado com sucesso!

echo.
echo ========================================
echo  🎉 Ambiente pronto para desenvolvimento!
echo ========================================
echo.
echo 📋 Próximos passos:
echo.
echo 1. Para iniciar o BACKEND, abra um novo terminal e execute:
echo    cd cracha-virtual-system
echo    npm install (apenas na primeira vez)
echo    npm run dev
echo.
echo 2. Para iniciar o FRONTEND, abra outro terminal e execute:
echo    cd cracha-virtual-frontend
echo    npm install (apenas na primeira vez)
echo    npm run dev
echo.
echo 🌐 URLs de acesso após iniciar os serviços:
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:3000/api
echo    Adminer:   http://localhost:8080
echo.
echo 🔑 Credenciais de teste:
echo    Admin:     admin@cracha.com / 123456
echo    Usuário:   user1@cracha.com / 123456
echo.
echo 💡 Dicas:
echo    - Use Ctrl+C para parar os serviços
echo    - Execute stop-dev.bat para parar o banco
echo    - Execute reset-db.bat para resetar dados
echo.
pause

