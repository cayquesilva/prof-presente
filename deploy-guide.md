# 🚀 Guia Completo de Deploy - Sistema de Crachás Virtuais

## Visão Geral

Este guia fornece instruções detalhadas para fazer o deploy do Sistema de Crachás Virtuais em uma VPS usando Docker Swarm, Portainer e Traefik. O sistema foi containerizado para facilitar o deployment e escalabilidade.

## 📋 Pré-requisitos

### Na sua VPS:
- Ubuntu 20.04+ ou CentOS 7+
- Docker 20.10+
- Docker Swarm inicializado
- Portainer instalado e configurado
- Traefik instalado e configurado
- Domínio configurado (ex: `seudominio.com`)

### No seu ambiente local:
- Docker instalado
- Conta no Docker Hub
- Acesso SSH à VPS

## 🐳 Preparação das Imagens Docker

### Passo 1: Configurar Variáveis

Antes de fazer o build, edite os seguintes arquivos:

**1. Editar `docker-compose.swarm.yml`:**
```yaml
# Substitua 'seu-usuario' pelo seu username do Docker Hub
image: seu-usuario/cracha-backend:latest
image: seu-usuario/cracha-frontend:latest

# Substitua 'seudominio.com' pelo seu domínio real
- "traefik.http.routers.cracha-backend.rule=Host(`api.seudominio.com`)"
- "traefik.http.routers.cracha-frontend.rule=Host(`cracha.seudominio.com`)"
```

**2. Editar `cracha-virtual-frontend/.env`:**
```env
VITE_API_URL=https://api.seudominio.com/api
```

**3. Editar `build-images.sh`:**
```bash
DOCKER_USERNAME="seu-usuario-dockerhub"
```

### Passo 2: Build e Push das Imagens

Execute o script de build:

```bash
./build-images.sh
```

Este script irá:
1. Fazer build das imagens do backend e frontend
2. Fazer login no Docker Hub
3. Fazer push das imagens para o Docker Hub

## 🌐 Configuração de DNS

Configure os seguintes registros DNS no seu provedor:

```
A    cracha.seudominio.com    -> IP_DA_SUA_VPS
A    api.seudominio.com      -> IP_DA_SUA_VPS
```

## 🔧 Deploy via Portainer

### Passo 1: Acessar Portainer

1. Acesse `https://portainer.seudominio.com`
2. Faça login com suas credenciais
3. Selecione o ambiente Docker Swarm

### Passo 2: Criar Stack

1. Vá em **Stacks** → **Add Stack**
2. Nome da stack: `cracha-virtual`
3. Copie o conteúdo do arquivo `docker-compose.swarm.yml`
4. Cole no editor do Portainer

### Passo 3: Configurar Variáveis de Ambiente

No Portainer, configure as seguintes variáveis de ambiente:

```env
POSTGRES_PASSWORD=sua_senha_super_segura
JWT_SECRET=sua_chave_jwt_super_segura_com_pelo_menos_32_caracteres
```

### Passo 4: Deploy da Stack

1. Clique em **Deploy the stack**
2. Aguarde o download das imagens e inicialização dos serviços
3. Verifique se todos os serviços estão rodando

## 🔍 Verificação do Deploy

### Verificar Serviços

No Portainer, vá em **Services** e verifique se estão rodando:
- `cracha-virtual_postgres` (1/1)
- `cracha-virtual_backend` (2/2)
- `cracha-virtual_frontend` (2/2)

### Testar Aplicação

1. **Frontend**: Acesse `https://cracha.seudominio.com`
2. **API**: Acesse `https://api.seudominio.com/api`
3. **Healthcheck**: Acesse `https://api.seudominio.com/health`

### Verificar Logs

No Portainer, clique em cada serviço e vá na aba **Logs** para verificar se não há erros.

## 🗄️ Inicialização do Banco de Dados

### Executar Migrações

As migrações são executadas automaticamente quando o backend inicia. Se precisar executar manualmente:

1. No Portainer, vá em **Containers**
2. Encontre um container do backend
3. Clique em **>_ Console**
4. Execute:
```bash
npx prisma migrate deploy
```

### Popular com Dados de Exemplo

Para popular o banco com dados de exemplo:

1. Acesse o console do container backend
2. Execute:
```bash
node scripts/seed.js
```

## 🔐 Configurações de Segurança

### SSL/TLS

O Traefik gerencia automaticamente os certificados SSL via Let's Encrypt. Verifique se:
- Os domínios estão acessíveis via HTTPS
- Os certificados são válidos
- Não há avisos de segurança no navegador

### Firewall

Configure o firewall da VPS para permitir apenas:
- Porta 80 (HTTP - redirecionamento)
- Porta 443 (HTTPS)
- Porta 22 (SSH)
- Porta 9000 (Portainer - se necessário)

### Backup

Configure backups regulares do volume do PostgreSQL:
```bash
# Backup manual
docker exec cracha-virtual_postgres_1 pg_dump -U cracha_user cracha_virtual > backup.sql

# Restaurar backup
docker exec -i cracha-virtual_postgres_1 psql -U cracha_user cracha_virtual < backup.sql
```

## 📊 Monitoramento

### Logs Centralizados

Configure o Portainer para coletar logs:
1. Vá em **Settings** → **Logging**
2. Configure driver de log apropriado
3. Defina rotação de logs

### Métricas

Monitore as seguintes métricas:
- CPU e memória dos containers
- Conexões do banco de dados
- Tempo de resposta da API
- Erros HTTP

### Alertas

Configure alertas para:
- Containers que param de funcionar
- Alto uso de recursos
- Erros críticos nos logs
- Certificados SSL próximos do vencimento

## 🔄 Atualizações

### Atualizar Aplicação

Para atualizar a aplicação:

1. **Build nova versão:**
```bash
# Altere a versão no build-images.sh
VERSION="v1.1.0"
./build-images.sh
```

2. **Atualizar no Portainer:**
- Vá na stack `cracha-virtual`
- Clique em **Editor**
- Altere as tags das imagens
- Clique em **Update the stack**

### Rolling Updates

O Docker Swarm faz rolling updates automaticamente:
- Zero downtime
- Rollback automático em caso de falha
- Verificação de saúde dos containers

## 🐛 Troubleshooting

### Problemas Comuns

**1. Serviços não iniciam:**
- Verifique logs no Portainer
- Confirme se as imagens foram baixadas
- Verifique conectividade de rede

**2. Banco de dados não conecta:**
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no docker-compose
- Verifique a rede Docker

**3. Frontend não carrega:**
- Verifique se o Nginx está rodando
- Confirme a configuração do Traefik
- Teste a conectividade com o backend

**4. SSL não funciona:**
- Verifique configuração DNS
- Confirme se o Traefik está rodando
- Verifique logs do Traefik

### Comandos Úteis

```bash
# Verificar status do swarm
docker node ls

# Verificar serviços
docker service ls

# Logs de um serviço
docker service logs cracha-virtual_backend

# Escalar serviço
docker service scale cracha-virtual_backend=3

# Remover stack
docker stack rm cracha-virtual
```

## 📈 Otimizações de Performance

### Banco de Dados

1. **Configurar connection pooling**
2. **Otimizar queries com índices**
3. **Configurar backup automático**
4. **Monitorar performance**

### Backend

1. **Configurar cache Redis** (opcional)
2. **Otimizar uploads de arquivos**
3. **Implementar rate limiting**
4. **Configurar logs estruturados**

### Frontend

1. **CDN para assets estáticos**
2. **Compressão gzip/brotli**
3. **Cache de browser otimizado**
4. **Lazy loading de componentes**

## 🔒 Backup e Recuperação

### Estratégia de Backup

1. **Backup diário do banco:**
```bash
# Cron job para backup automático
0 2 * * * docker exec cracha-virtual_postgres_1 pg_dump -U cracha_user cracha_virtual | gzip > /backups/cracha_$(date +\%Y\%m\%d).sql.gz
```

2. **Backup dos uploads:**
```bash
# Backup do volume de uploads
docker run --rm -v cracha-virtual_backend_uploads:/data -v /backups:/backup alpine tar czf /backup/uploads_$(date +\%Y\%m\%d).tar.gz -C /data .
```

### Recuperação de Desastres

1. **Restaurar banco:**
```bash
gunzip < /backups/cracha_20241201.sql.gz | docker exec -i cracha-virtual_postgres_1 psql -U cracha_user cracha_virtual
```

2. **Restaurar uploads:**
```bash
docker run --rm -v cracha-virtual_backend_uploads:/data -v /backups:/backup alpine tar xzf /backup/uploads_20241201.tar.gz -C /data
```

## 📞 Suporte

Para suporte técnico:
- **Email**: suporte@seudominio.com
- **Documentação**: https://docs.seudominio.com
- **Issues**: GitHub repository

---

## ✅ Checklist de Deploy

- [ ] VPS configurada com Docker Swarm
- [ ] Portainer instalado e funcionando
- [ ] Traefik configurado com SSL
- [ ] DNS configurado corretamente
- [ ] Imagens Docker criadas e enviadas para Docker Hub
- [ ] Stack deployada via Portainer
- [ ] Todos os serviços rodando
- [ ] Frontend acessível via HTTPS
- [ ] API funcionando corretamente
- [ ] Banco de dados inicializado
- [ ] Dados de exemplo carregados (opcional)
- [ ] Backup configurado
- [ ] Monitoramento ativo

**🎉 Parabéns! Seu Sistema de Crachás Virtuais está no ar!**

