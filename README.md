# 🎫 Sistema de Crachás Virtuais

> Uma plataforma completa para gestão moderna de eventos com crachás virtuais, QR codes e gamificação

[![Node.js](https://img.shields.io/badge/Node.js-22.13.0-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Sobre o Projeto

O Sistema de Crachás Virtuais é uma solução tecnológica inovadora que revoluciona a gestão de eventos através da digitalização completa do processo de credenciamento. Desenvolvido com tecnologias modernas, o sistema oferece uma experiência seamless para organizadores e participantes, eliminando a necessidade de crachás físicos e automatizando processos operacionais.

### ✨ Principais Funcionalidades

- 🔐 **Autenticação Segura**: Sistema robusto com JWT e criptografia bcrypt
- 👥 **Gestão de Usuários**: CRUD completo com perfis personalizáveis
- 📅 **Gestão de Eventos**: Criação e administração de eventos de qualquer escala
- 📝 **Sistema de Inscrições**: Workflow automatizado com aprovação e controle de vagas
- 🎫 **Crachás Virtuais**: Geração automática com QR codes únicos e seguros
- ✅ **Check-in Automatizado**: Leitura rápida de QR codes com validação em tempo real
- 🏆 **Gamificação**: Sistema de badges e premiações para engajamento
- ⭐ **Avaliações**: Feedback estruturado para melhoria contínua
- 📊 **Relatórios Avançados**: Analytics e insights para organizadores
- 📱 **PWA Ready**: Funcionalidade de wallet mobile para crachás

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js 22.13.0** - Runtime JavaScript de alta performance
- **Express.js 5.1.0** - Framework web minimalista e flexível
- **Prisma ORM 6.16.2** - ORM moderno e type-safe
- **PostgreSQL** - Banco de dados relacional robusto
- **JWT** - Autenticação stateless e segura
- **bcryptjs** - Hashing seguro de senhas
- **QRCode** - Geração de códigos QR
- **Multer** - Upload de arquivos

### Frontend
- **React.js 19.1.0** - Biblioteca para interfaces de usuário
- **Vite 6.3.5** - Build tool moderno e rápido
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Componentes UI modernos
- **React Router DOM** - Roteamento declarativo
- **Axios** - Cliente HTTP
- **React Query** - Gerenciamento de estado servidor

## 📦 Instalação

### Pré-requisitos

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/download/win)

### Instalação Local no Windows

Para instruções detalhadas sobre como configurar o ambiente de desenvolvimento local no Windows, incluindo a configuração do PostgreSQL via Docker, scripts de automação e solução de problemas, consulte o guia completo:

- **[📘 Guia de Instalação Local no Windows](guia_instalacao_windows.md)**

### Instalação para Produção (Docker Swarm)

Para instruções sobre como preparar e implantar o sistema em um ambiente de produção utilizando Docker Swarm, Portainer e Traefik, consulte o guia de deploy:

- **[🐳 Guia de Deploy para Produção](deploy-guide.md)**

## 🏃‍♂️ Executando o Projeto

Consulte os guias de instalação para instruções detalhadas sobre como executar o projeto em seu ambiente.

## 👤 Credenciais de Teste

Após executar o script de seed:

- **Admin**: admin@cracha.com / 123456
- **Usuário**: user1@cracha.com / 123456

## 📚 Documentação Completa

### Guias de Instalação
- **[📘 Guia de Instalação Local no Windows](guia_instalacao_windows.md)** - Instalação detalhada para Windows com Docker
- **[🐳 Guia de Deploy para Produção](deploy-guide.md)** - Deploy com Docker Swarm e Portainer

### Arquitetura e APIs
- **[📚 Documentação Técnica Completa](documentacao_completa.md)** - Arquitetura, APIs e otimizações de performance
- **[🏗️ Documentação da Arquitetura](documentacao_arquitetura.md)** - Visão geral técnica
- **[📊 Modelo de Dados](erd_diagram.png)** - Diagrama ERD do banco

### Manual do Usuário
- **[👤 Manual do Usuário](manual_usuario.md)** - Como usar o sistema

## 🔧 Scripts Úteis

### Windows (Desenvolvimento Local)

Os scripts `.bat` para Windows estão localizados na pasta `scripts/` e são detalhados no [Guia de Instalação Local no Windows](guia_instalacao_windows.md).

### Docker (Produção)

Os scripts para Docker (build-images.sh) e comandos de deploy estão detalhados no [Guia de Deploy para Produção](deploy-guide.md).

## 🏗️ Estrutura do Projeto

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

## 🔧 Configuração Avançada

### Variáveis de Ambiente (Backend)

```env
# Banco de dados (Docker local)
DATABASE_URL="postgresql://cracha_user:cracha123@localhost:5432/cracha_virtual_dev"

# JWT
JWT_SECRET="sua_chave_secreta_super_segura"
JWT_EXPIRES_IN="24h"

# Servidor
PORT=3000
NODE_ENV="development"

# Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="5242880"

# CORS
CORS_ORIGIN="http://localhost:5173"
```

### Variáveis de Ambiente (Frontend)

```env
# URL da API local
VITE_API_URL=http://localhost:3000/api
```

## 📊 Funcionalidades Detalhadas

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
