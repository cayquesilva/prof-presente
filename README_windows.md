# 🎫 Sistema de Crachás Virtuais - Windows

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)
[![Windows](https://img.shields.io/badge/Windows-10%2F11-blue.svg)](https://microsoft.com/windows)

Um sistema completo para gestão de crachás virtuais com QR codes, check-ins automáticos, gamificação e relatórios avançados. **Otimizado para desenvolvimento local no Windows**.

## 🚀 Características Principais

- **🎫 Crachás Virtuais**: Geração automática de crachás com QR codes únicos
- **📱 Check-ins Inteligentes**: Sistema de check-in via QR code com validação em tempo real
- **🏆 Gamificação**: Sistema de badges e premiações automáticas baseadas em frequência
- **📊 Relatórios Avançados**: Dashboards com métricas de participação e frequência
- **👥 Gestão de Usuários**: Sistema completo de cadastro e permissões
- **📅 Gestão de Eventos**: Criação e administração de cursos e formações
- **⭐ Avaliações**: Sistema de feedback e avaliação de eventos
- **🔒 Segurança**: Autenticação JWT e criptografia de dados sensíveis

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** com Express.js
- **PostgreSQL** com Prisma ORM (via Docker)
- **JWT** para autenticação
- **Bcrypt** para criptografia de senhas
- **QR Code** para geração de códigos únicos
- **Multer** para upload de arquivos

### Frontend
- **React 18** com Hooks e Context API
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **React Query** para gerenciamento de estado
- **Lucide React** para ícones

### Infraestrutura
- **Docker Desktop** para PostgreSQL
- **Nginx** para proxy reverso (produção)
- **Scripts Windows** para automação

## 📋 Pré-requisitos para Windows

### Software Obrigatório

1. **Node.js 18+** - [Download](https://nodejs.org/)
   - Baixe a versão LTS mais recente
   - Marque "Automatically install the necessary tools" durante a instalação

2. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
   - Necessário para executar o PostgreSQL
   - Execute como administrador durante a instalação

3. **Git para Windows** - [Download](https://git-scm.com/download/win)
   - Mantenha as configurações padrão
   - Inclui Git Bash para comandos Unix-like

### Software Recomendado

4. **Visual Studio Code** - [Download](https://code.visualstudio.com/)
   - Editor recomendado com extensões para React e Node.js

5. **Windows Terminal** - [Microsoft Store](https://aka.ms/terminal)
   - Terminal moderno para melhor experiência de desenvolvimento

## 🏃‍♂️ Início Rápido (Windows)

### 1. Download do Projeto

```cmd
# Opção 1: Clone via Git
git clone [URL_DO_REPOSITORIO]
cd cracha-virtual-system

# Opção 2: Baixe e extraia o arquivo ZIP
# Extraia para C:\Projetos\cracha-virtual-system (ou pasta de sua escolha)
```

### 2. Configuração Automática

Execute o script de inicialização que configura tudo automaticamente:

```cmd
# Execute o script de setup
scripts\start-dev.bat
```

Este script irá:
- ✅ Verificar se Docker e Node.js estão instalados
- ✅ Iniciar o banco PostgreSQL em container
- ✅ Configurar o banco de dados
- ✅ Mostrar as próximas etapas

### 3. Iniciar Backend

Abra um novo **Prompt de Comando** ou **PowerShell**:

```cmd
cd cracha-virtual-system
npm install
npm run dev
```

### 4. Iniciar Frontend

Abra outro **Prompt de Comando** ou **PowerShell**:

```cmd
cd cracha-virtual-frontend
npm install
npm run dev
```

### 5. Acessar o Sistema

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Adminer (DB)**: http://localhost:8080

### 🔑 Credenciais de Teste
- **Admin**: admin@cracha.com / 123456
- **Usuário**: user1@cracha.com / 123456

## 🔧 Scripts Windows Incluídos

### Scripts de Automação

O projeto inclui scripts `.bat` para facilitar o desenvolvimento no Windows:

```cmd
# Iniciar ambiente completo
scripts\start-dev.bat

# Parar todos os serviços
scripts\stop-dev.bat

# Resetar banco de dados (apaga todos os dados)
scripts\reset-db.bat
```

### Estrutura dos Scripts

- **start-dev.bat**: Configura e inicia o ambiente de desenvolvimento
- **stop-dev.bat**: Para todos os containers Docker
- **reset-db.bat**: Reseta o banco e recria dados de exemplo

## 🗄️ Configuração do Banco PostgreSQL

### Via Docker (Recomendado)

O PostgreSQL roda em um container Docker, eliminando a necessidade de instalação local:

```yaml
# docker-compose.dev.yml (já incluído)
services:
  postgres-dev:
    image: postgres:15-alpine
    container_name: cracha_postgres_dev
    environment:
      POSTGRES_DB: cracha_virtual_dev
      POSTGRES_USER: cracha_user
      POSTGRES_PASSWORD: cracha123
    ports:
      - "5432:5432"
```

### Administração via Adminer

Interface web para gerenciar o banco:
- **URL**: http://localhost:8080
- **Sistema**: PostgreSQL
- **Servidor**: postgres-dev
- **Usuário**: cracha_user
- **Senha**: cracha123

## 📁 Estrutura do Projeto

```
cracha-virtual-system/
├── 📁 cracha-virtual-system/     # Backend Node.js
│   ├── 📁 src/
│   │   ├── 📁 controllers/       # Controladores da API
│   │   ├── 📁 routes/           # Rotas da API
│   │   ├── 📁 middleware/       # Middlewares
│   │   └── 📁 utils/            # Utilitários
│   ├── 📁 prisma/               # Schema e migrações
│   ├── 📁 scripts/              # Scripts de seed
│   └── 📁 uploads/              # Arquivos enviados
├── 📁 cracha-virtual-frontend/   # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 components/       # Componentes React
│   │   ├── 📁 pages/           # Páginas da aplicação
│   │   ├── 📁 hooks/           # Hooks customizados
│   │   └── 📁 lib/             # Bibliotecas e utils
├── 📁 scripts/                  # Scripts Windows (.bat)
│   ├── 📄 start-dev.bat        # Iniciar desenvolvimento
│   ├── 📄 stop-dev.bat         # Parar serviços
│   └── 📄 reset-db.bat         # Resetar banco
├── 📄 docker-compose.dev.yml    # Docker para desenvolvimento
├── 📄 guia_instalacao_windows.md # Guia detalhado
└── 📄 README_windows.md         # Este arquivo
```

## ⚙️ Configuração de Variáveis

### Backend (.env)
```env
# Banco de dados (Docker local)
DATABASE_URL="postgresql://cracha_user:cracha123@localhost:5432/cracha_virtual_dev"

# JWT
JWT_SECRET="sua_chave_secreta_super_segura"
JWT_EXPIRES_IN="24h"

# Servidor
PORT=3000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (.env)
```env
# URL da API local
VITE_API_URL=http://localhost:3000/api
```

## 🚀 Funcionalidades Implementadas

### ✅ Sistema Completo
- **Autenticação JWT** com refresh tokens
- **CRUD de Usuários** com upload de fotos
- **Gestão de Eventos** completa
- **Sistema de Inscrições** com aprovação
- **Crachás Virtuais** com QR codes únicos
- **Check-ins Automáticos** via QR code
- **Gamificação** com badges e rankings
- **Avaliações** de cursos e eventos
- **Relatórios** administrativos detalhados

### ⚡ Otimizações de Performance
- **Lazy Loading** de componentes React
- **Connection Pooling** para PostgreSQL
- **Indexação avançada** no banco de dados
- **Cache inteligente** com React Query
- **Compressão** de assets

## 🐛 Solução de Problemas Windows

### Problemas Comuns

**❌ "Docker daemon is not running"**
```cmd
# Solução: Inicie o Docker Desktop e aguarde carregar completamente
# Verifique no system tray se o Docker está rodando
```

**❌ "Port 5432 is already in use"**
```cmd
# Solução: Pare outros serviços PostgreSQL ou altere a porta
# Verifique: netstat -ano | findstr :5432
```

**❌ "npm ERR! peer dep missing"**
```cmd
# Solução: Use legacy peer deps
npm install --legacy-peer-deps
```

**❌ "Cannot find module"**
```cmd
# Solução: Limpe e reinstale dependências
rmdir /s node_modules
del package-lock.json
npm install
```

### Performance no Windows

**Antivírus interferindo**
- Adicione as pastas do projeto às exclusões do Windows Defender
- Caminho: Windows Security > Virus & threat protection > Exclusions

**Build lento**
- Exclua `node_modules` do antivírus
- Use SSD para melhor performance
- Feche programas desnecessários durante o desenvolvimento

## 📚 Comandos Úteis Windows

### Docker
```cmd
# Ver containers rodando
docker ps

# Ver logs do banco
docker logs cracha_postgres_dev

# Acessar banco via linha de comando
docker exec -it cracha_postgres_dev psql -U cracha_user -d cracha_virtual_dev

# Parar todos os containers
docker-compose -f docker-compose.dev.yml down
```

### npm
```cmd
# Instalar dependências
npm install

# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Limpar cache
npm cache clean --force
```

### Prisma
```cmd
# Gerar cliente
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Resetar banco
npx prisma migrate reset

# Interface visual do banco
npx prisma studio
```

## 🔄 Workflow de Desenvolvimento

### Rotina Diária

1. **Iniciar o dia**:
   ```cmd
   scripts\start-dev.bat
   ```

2. **Desenvolver** (2 terminais):
   ```cmd
   # Terminal 1 - Backend
   cd cracha-virtual-system
   npm run dev
   
   # Terminal 2 - Frontend  
   cd cracha-virtual-frontend
   npm run dev
   ```

3. **Finalizar o dia**:
   ```cmd
   scripts\stop-dev.bat
   ```

### Atualizações

Quando receber atualizações do projeto:

```cmd
# 1. Parar serviços
scripts\stop-dev.bat

# 2. Atualizar dependências
cd cracha-virtual-system && npm install
cd ..\cracha-virtual-frontend && npm install

# 3. Executar migrações
cd ..\cracha-virtual-system && npx prisma migrate dev

# 4. Reiniciar
scripts\start-dev.bat
```

## 📖 Documentação Adicional

- **[📘 Guia Detalhado Windows](guia_instalacao_windows.md)** - Instruções completas
- **[🐳 Deploy Docker](deploy-guide.md)** - Para produção
- **[📚 Documentação Técnica](documentacao_completa.md)** - Arquitetura e APIs
- **[👤 Manual do Usuário](manual_usuario.md)** - Como usar o sistema

## 🎯 Próximos Passos

Após a instalação, você pode:

1. **Explorar o sistema** com as credenciais de teste
2. **Criar novos eventos** e testar inscrições
3. **Gerar crachás** e testar check-ins
4. **Visualizar relatórios** no dashboard admin
5. **Personalizar** conforme suas necessidades

## 🤝 Suporte

Para dúvidas ou problemas:

1. Consulte o **[Guia Detalhado](guia_instalacao_windows.md)**
2. Verifique a seção **Solução de Problemas** acima
3. Execute `scripts\reset-db.bat` se houver problemas com dados
4. Reinicie o Docker Desktop se necessário

## 📄 Licença

Este projeto está sob a licença MIT. Desenvolvido com foco em qualidade, performance e facilidade de uso no Windows.

---

**🚀 Desenvolvido por Manus AI** - Sistema profissional pronto para uso em produção, otimizado para desenvolvimento local no Windows.

