# 🪟 Guia de Instalação Local - Windows

## Sistema de Crachás Virtuais - Instalação para Desenvolvimento Local

Este guia fornece instruções detalhadas para configurar o Sistema de Crachás Virtuais em um ambiente de desenvolvimento local no Windows, utilizando PostgreSQL em contêiner Docker para facilitar a configuração e manutenção do banco de dados.

## 📋 Pré-requisitos

### Software Necessário

Antes de iniciar a instalação, certifique-se de ter os seguintes softwares instalados em seu sistema Windows:

**Node.js (versão 18.0 ou superior)**
O Node.js é essencial para executar tanto o backend quanto o frontend da aplicação. Recomendamos a versão LTS mais recente para garantir estabilidade e suporte de longo prazo.

1. Acesse o site oficial do Node.js: https://nodejs.org/
2. Baixe a versão LTS (Long Term Support) para Windows
3. Execute o instalador e siga as instruções padrão
4. Marque a opção "Automatically install the necessary tools" durante a instalação
5. Após a instalação, abra o Prompt de Comando ou PowerShell e verifique:
   ```cmd
   node --version
   npm --version
   ```

**Git para Windows**
O Git é necessário para clonar o repositório e gerenciar versões do código.

1. Acesse: https://git-scm.com/download/win
2. Baixe e execute o instalador
3. Durante a instalação, mantenha as configurações padrão
4. Certifique-se de que "Git Bash" seja instalado junto
5. Verifique a instalação:
   ```cmd
   git --version
   ```

**Docker Desktop para Windows**
O Docker será usado exclusivamente para executar o banco de dados PostgreSQL, simplificando a configuração e evitando conflitos com outras instalações.

1. Acesse: https://www.docker.com/products/docker-desktop/
2. Baixe o Docker Desktop para Windows
3. Execute o instalador como administrador
4. Após a instalação, reinicie o computador se solicitado
5. Inicie o Docker Desktop e aguarde a inicialização completa
6. Verifique a instalação:
   ```cmd
   docker --version
   docker-compose --version
   ```

**Editor de Código (Recomendado)**
Embora não seja obrigatório, recomendamos o uso de um editor de código moderno:

- **Visual Studio Code**: https://code.visualstudio.com/
- **WebStorm**: https://www.jetbrains.com/webstorm/
- **Sublime Text**: https://www.sublimetext.com/

### Configuração do Ambiente

**Configuração do PowerShell (Recomendado)**
Para uma melhor experiência de desenvolvimento, configure o PowerShell como terminal padrão:

1. Abra o PowerShell como administrador
2. Execute o comando para permitir scripts:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Instale o Windows Terminal (opcional, mas recomendado):
   - Acesse a Microsoft Store
   - Procure por "Windows Terminal"
   - Instale e configure como terminal padrão

**Configuração de Variáveis de Ambiente**
Certifique-se de que o Node.js e npm estejam no PATH do sistema:

1. Pressione `Win + R`, digite `sysdm.cpl` e pressione Enter
2. Clique na aba "Avançado"
3. Clique em "Variáveis de Ambiente"
4. Verifique se existe uma entrada para Node.js no PATH do sistema
5. Se não existir, adicione o caminho de instalação do Node.js (geralmente `C:\Program Files\nodejs\`)

## 🗄️ Configuração do Banco de Dados PostgreSQL

### Criação do Docker Compose para Desenvolvimento

O PostgreSQL será executado em um contêiner Docker, proporcionando isolamento e facilidade de configuração. Esta abordagem elimina a necessidade de instalar o PostgreSQL diretamente no Windows e evita conflitos com outras aplicações.

Crie um arquivo chamado `docker-compose.dev.yml` na raiz do projeto com o seguinte conteúdo:

```yaml
version: '3.8'

services:
  # Banco de dados PostgreSQL para desenvolvimento
  postgres-dev:
    image: postgres:15-alpine
    container_name: cracha_postgres_dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: cracha_virtual_dev
      POSTGRES_USER: cracha_user
      POSTGRES_PASSWORD: cracha123
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./scripts/init-dev.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - cracha_dev_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cracha_user -d cracha_virtual_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Adminer para administração do banco (opcional)
  adminer:
    image: adminer:latest
    container_name: cracha_adminer_dev
    restart: unless-stopped
    ports:
      - "8080:8080"
    networks:
      - cracha_dev_network
    depends_on:
      - postgres-dev

volumes:
  postgres_dev_data:
    driver: local

networks:
  cracha_dev_network:
    driver: bridge
```

### Script de Inicialização do Banco

Crie um diretório `scripts` na raiz do projeto e dentro dele um arquivo `init-dev.sql`:

```sql
-- Script de inicialização para desenvolvimento
-- Configurações otimizadas para ambiente local

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configurações de performance para desenvolvimento
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '512MB';
ALTER SYSTEM SET maintenance_work_mem = '32MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '8MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configurações específicas para desenvolvimento
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Recarregar configurações
SELECT pg_reload_conf();

-- Criar usuário adicional para desenvolvimento (opcional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dev_user') THEN
        CREATE ROLE dev_user WITH LOGIN PASSWORD 'dev123';
        GRANT CONNECT ON DATABASE cracha_virtual_dev TO dev_user;
        GRANT USAGE ON SCHEMA public TO dev_user;
        GRANT CREATE ON SCHEMA public TO dev_user;
    END IF;
END
$$;
```

### Inicialização do Banco de Dados

Para inicializar o banco de dados PostgreSQL em Docker:

1. **Abra o PowerShell ou Prompt de Comando** na raiz do projeto
2. **Inicie o Docker Desktop** e aguarde até que esteja completamente carregado
3. **Execute o comando para iniciar o banco**:
   ```cmd
   docker-compose -f docker-compose.dev.yml up -d postgres-dev
   ```
4. **Verifique se o contêiner está rodando**:
   ```cmd
   docker ps
   ```
5. **Teste a conexão com o banco**:
   ```cmd
   docker exec -it cracha_postgres_dev psql -U cracha_user -d cracha_virtual_dev -c "SELECT version();"
   ```

### Administração do Banco (Opcional)

O Adminer foi incluído no docker-compose para facilitar a administração do banco de dados através de uma interface web:

1. **Inicie o Adminer**:
   ```cmd
   docker-compose -f docker-compose.dev.yml up -d adminer
   ```
2. **Acesse no navegador**: http://localhost:8080
3. **Credenciais de acesso**:
   - Sistema: PostgreSQL
   - Servidor: postgres-dev
   - Usuário: cracha_user
   - Senha: cracha123
   - Base de dados: cracha_virtual_dev

## 🚀 Instalação do Projeto

### Download e Configuração Inicial

**Método 1: Download do ZIP**
1. Baixe o arquivo ZIP do projeto
2. Extraia para um diretório de sua escolha (ex: `C:\Projetos\cracha-virtual-system`)
3. Abra o PowerShell na pasta extraída

**Método 2: Clone via Git (se disponível)**
```cmd
git clone [URL_DO_REPOSITORIO] cracha-virtual-system
cd cracha-virtual-system
```

### Configuração do Backend

Navegue até o diretório do backend e configure o ambiente:

```cmd
cd cracha-virtual-system
```

**Instalação das Dependências**
```cmd
npm install
```

Se encontrar erros de resolução de dependências, use:
```cmd
npm install --legacy-peer-deps
```

**Configuração das Variáveis de Ambiente**
Crie um arquivo `.env` na raiz do diretório backend com o seguinte conteúdo:

```env
# Configurações do banco de dados
DATABASE_URL="postgresql://cracha_user:cracha123@localhost:5432/cracha_virtual_dev"

# Configurações JWT
JWT_SECRET="sua_chave_secreta_super_segura_para_desenvolvimento"
JWT_EXPIRES_IN="24h"

# Configurações do servidor
PORT=3000
NODE_ENV="development"

# Configurações de upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="5242880"

# Configurações de CORS
CORS_ORIGIN="http://localhost:5173"

# Configurações do pool de conexões
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_ACQUIRE_TIMEOUT=60000
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_MAX_LIFETIME=1800000
```

**Configuração do Prisma**
```cmd
# Gerar o cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev --name init

# Popular banco com dados de exemplo (opcional)
node scripts/seed.js
```

### Configuração do Frontend

Abra um novo terminal PowerShell e navegue até o diretório do frontend:

```cmd
cd cracha-virtual-frontend
```

**Instalação das Dependências**
```cmd
npm install
```

**Configuração das Variáveis de Ambiente**
Crie um arquivo `.env` na raiz do diretório frontend:

```env
VITE_API_URL=http://localhost:3000/api
```

## ▶️ Executando o Sistema

### Inicialização dos Serviços

Para executar o sistema completo, você precisará de três terminais:

**Terminal 1 - Banco de Dados (se não estiver rodando)**
```cmd
docker-compose -f docker-compose.dev.yml up -d
```

**Terminal 2 - Backend**
```cmd
cd cracha-virtual-system
npm run dev
```

**Terminal 3 - Frontend**
```cmd
cd cracha-virtual-frontend
npm run dev
```

### Verificação da Instalação

Após inicializar todos os serviços, verifique se estão funcionando corretamente:

1. **Backend API**: http://localhost:3000/api
2. **Frontend**: http://localhost:5173
3. **Adminer (se habilitado)**: http://localhost:8080

### Credenciais de Teste

Se você executou o script de seed, use estas credenciais para testar:

- **Administrador**: admin@cracha.com / 123456
- **Usuário comum**: user1@cracha.com / 123456

## 🛠️ Scripts de Automação para Windows

### Script de Inicialização Completa

Crie um arquivo `start-dev.bat` na raiz do projeto:

```batch
@echo off
echo ========================================
echo  Sistema de Crachas Virtuais - Dev
echo ========================================
echo.

echo Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Docker nao encontrado. Instale o Docker Desktop.
    pause
    exit /b 1
)

echo Iniciando banco de dados PostgreSQL...
docker-compose -f docker-compose.dev.yml up -d postgres-dev

echo Aguardando banco de dados ficar pronto...
timeout /t 10 /nobreak >nul

echo Verificando conexao com banco...
docker exec cracha_postgres_dev pg_isready -U cracha_user -d cracha_virtual_dev
if errorlevel 1 (
    echo ERRO: Banco de dados nao esta respondendo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Banco de dados iniciado com sucesso!
echo ========================================
echo.
echo Para iniciar o backend, execute:
echo   cd cracha-virtual-system
echo   npm run dev
echo.
echo Para iniciar o frontend, execute:
echo   cd cracha-virtual-frontend  
echo   npm run dev
echo.
echo URLs de acesso:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000/api
echo   Adminer:  http://localhost:8080
echo.
pause
```

### Script de Parada dos Serviços

Crie um arquivo `stop-dev.bat`:

```batch
@echo off
echo Parando servicos do Sistema de Crachas Virtuais...

echo Parando containers Docker...
docker-compose -f docker-compose.dev.yml down

echo Servicos parados com sucesso!
pause
```

### Script de Reset do Banco

Crie um arquivo `reset-db.bat`:

```batch
@echo off
echo ========================================
echo  RESET DO BANCO DE DADOS
echo ========================================
echo.
echo ATENCAO: Esta operacao ira apagar todos os dados!
echo.
set /p confirm="Tem certeza? (S/N): "
if /i not "%confirm%"=="S" (
    echo Operacao cancelada.
    pause
    exit /b 0
)

echo Parando containers...
docker-compose -f docker-compose.dev.yml down

echo Removendo volume do banco...
docker volume rm cracha-virtual-system_postgres_dev_data

echo Reiniciando banco de dados...
docker-compose -f docker-compose.dev.yml up -d postgres-dev

echo Aguardando banco ficar pronto...
timeout /t 15 /nobreak >nul

echo Executando migracoes...
cd cracha-virtual-system
npx prisma migrate dev --name reset

echo Populando com dados de exemplo...
node scripts/seed.js

echo.
echo Banco de dados resetado com sucesso!
pause
```

## 🔧 Configurações Avançadas

### Configuração do Visual Studio Code

Se você usa o VS Code, crie um arquivo `.vscode/settings.json` na raiz do projeto:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.env": "dotenv"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### Extensões Recomendadas para VS Code

Crie um arquivo `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.powershell"
  ]
}
```

### Configuração de Debugging

Crie um arquivo `.vscode/launch.json` para debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/cracha-virtual-system/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/cracha-virtual-system"
    }
  ]
}
```

## 🐛 Solução de Problemas Comuns

### Problemas com Docker

**Erro: "Docker daemon is not running"**
- Solução: Inicie o Docker Desktop e aguarde a inicialização completa

**Erro: "Port 5432 is already in use"**
- Solução: Pare outros serviços PostgreSQL ou altere a porta no docker-compose.dev.yml

**Erro: "No space left on device"**
- Solução: Execute `docker system prune` para limpar containers e imagens não utilizados

### Problemas com Node.js

**Erro: "npm ERR! peer dep missing"**
- Solução: Execute `npm install --legacy-peer-deps`

**Erro: "Cannot find module"**
- Solução: Delete `node_modules` e execute `npm install` novamente

**Erro: "Port 3000 is already in use"**
- Solução: Altere a porta no arquivo `.env` ou pare o processo que está usando a porta

### Problemas com Prisma

**Erro: "Environment variable not found: DATABASE_URL"**
- Solução: Verifique se o arquivo `.env` existe e contém a variável DATABASE_URL

**Erro: "Can't reach database server"**
- Solução: Verifique se o container PostgreSQL está rodando com `docker ps`

**Erro: "Migration failed"**
- Solução: Execute `npx prisma migrate reset` para resetar as migrações

### Problemas de Performance

**Aplicação lenta no Windows**
- Solução: Adicione as pastas do projeto ao Windows Defender Exclusions
- Caminho: Windows Security > Virus & threat protection > Exclusions

**Build lento do frontend**
- Solução: Adicione `node_modules` às exclusões do antivírus

## 📚 Comandos Úteis

### Comandos Docker
```cmd
# Verificar containers rodando
docker ps

# Ver logs do banco
docker logs cracha_postgres_dev

# Acessar shell do banco
docker exec -it cracha_postgres_dev psql -U cracha_user -d cracha_virtual_dev

# Parar todos os containers
docker-compose -f docker-compose.dev.yml down

# Remover volumes (apaga dados)
docker-compose -f docker-compose.dev.yml down -v
```

### Comandos Prisma
```cmd
# Gerar cliente
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Resetar banco
npx prisma migrate reset

# Visualizar banco (Prisma Studio)
npx prisma studio

# Verificar status das migrações
npx prisma migrate status
```

### Comandos npm
```cmd
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Fazer build para produção
npm run build

# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências
npm update
```

## 🔄 Workflow de Desenvolvimento

### Rotina Diária de Desenvolvimento

1. **Iniciar o dia**:
   ```cmd
   # Execute o script de inicialização
   start-dev.bat
   ```

2. **Desenvolver**:
   - Abra dois terminais adicionais
   - Terminal 1: `cd cracha-virtual-system && npm run dev`
   - Terminal 2: `cd cracha-virtual-frontend && npm run dev`

3. **Finalizar o dia**:
   ```cmd
   # Execute o script de parada
   stop-dev.bat
   ```

### Backup e Restore de Dados

**Fazer backup**:
```cmd
docker exec cracha_postgres_dev pg_dump -U cracha_user cracha_virtual_dev > backup.sql
```

**Restaurar backup**:
```cmd
docker exec -i cracha_postgres_dev psql -U cracha_user cracha_virtual_dev < backup.sql
```

### Atualizações do Projeto

Quando receber atualizações do projeto:

1. **Parar serviços**:
   ```cmd
   stop-dev.bat
   ```

2. **Atualizar dependências**:
   ```cmd
   cd cracha-virtual-system
   npm install
   
   cd ../cracha-virtual-frontend
   npm install
   ```

3. **Executar migrações**:
   ```cmd
   cd cracha-virtual-system
   npx prisma migrate dev
   ```

4. **Reiniciar serviços**:
   ```cmd
   start-dev.bat
   ```

Este guia fornece uma base sólida para desenvolvimento local no Windows, aproveitando a containerização do PostgreSQL para simplificar a configuração e manutenção do ambiente de desenvolvimento.

