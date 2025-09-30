# Instruções de Uso - Sistema de Crachás Virtuais

## Guia Rápido para Iniciar o Sistema

---

## 1. Requisitos

### Sistema Operacional
- Windows 10/11
- Linux (Ubuntu 20.04+)
- macOS 11+

### Software Necessário
- Docker Desktop (v20.10+)
- Node.js 22+ (para desenvolvimento)
- Git

---

## 2. Instalação Rápida

### Opção 1: Docker (Recomendado)

```bash
# 1. Clone ou extraia o projeto
cd caminho/do/projeto

# 2. Configure as variáveis de ambiente
# Edite o arquivo .env se necessário

# 3. Inicie os containers
docker-compose -f docker-compose.dev.yml up -d

# 4. Acesse o sistema
# Frontend: http://localhost
# Backend: http://localhost:3000
```

### Opção 2: Desenvolvimento Local

```bash
# Backend
cd cracha-virtual-system
npm install
npm run dev

# Frontend (em outro terminal)
cd cracha-virtual-frontend
npm install --legacy-peer-deps
npm run dev
```

---

## 3. Credenciais Padrão

### Administrador
```
Email: admin@example.com
Senha: admin123
```

### Usuário de Teste
```
Email: user@example.com
Senha: user123
```

---

## 4. Funcionalidades Principais

### 4.1 Para Participantes

#### Cadastro e Login
1. Acesse a página de registro
2. Preencha todos os campos obrigatórios
3. Clique em "Cadastrar"
4. Faça login com suas credenciais

#### Visualizar Eventos
1. Acesse "Eventos" no menu
2. Navegue pelos eventos disponíveis
3. Use a barra de busca para filtrar
4. Clique em "Ver detalhes" para mais informações

#### Inscrever-se em Eventos
1. Na página de detalhes do evento
2. Clique em "Inscrever-se"
3. Aguarde a aprovação (automática ou manual)
4. Receba seu crachá virtual

#### Acessar Crachá Virtual
1. Acesse "Meus Crachás" no menu
2. Clique em "Ver Crachá"
3. Visualize seu QR Code
4. Baixe ou imprima se necessário

#### Realizar Check-in
1. No dia do evento, vá até o local
2. Apresente seu QR Code
3. O organizador escaneará seu crachá
4. Você receberá confirmação de presença

#### Avaliar Eventos
1. Após participar de um evento
2. Acesse "Avaliações" no menu
3. Selecione o evento
4. Avalie com estrelas (1-5)
5. Adicione um comentário (opcional)

#### Exportar Seus Dados
1. Acesse "Perfil" no menu
2. Vá para a aba "Meus Dados"
3. Clique em "Exportar Meus Dados"
4. Um arquivo JSON será baixado

---

### 4.2 Para Administradores

#### Acessar Painel Admin
1. Faça login como administrador
2. Acesse "Administração" no menu
3. Visualize o dashboard com estatísticas

#### Criar Evento
1. No painel admin, vá para a aba "Eventos"
2. Clique em "Novo Evento"
3. Preencha o formulário:
   - Título
   - Descrição
   - Local
   - Data de início e término
   - Capacidade máxima (opcional)
4. Clique em "Criar"

#### Editar Evento
1. Na lista de eventos, clique no ícone de editar
2. Modifique os campos desejados
3. Clique em "Atualizar"

#### Excluir Evento
1. Na lista de eventos, clique no ícone de excluir
2. Confirme a exclusão
3. O evento será removido permanentemente

#### Gerenciar Usuários
1. No painel admin, vá para a aba "Usuários"
2. Visualize a lista completa de usuários
3. Veja informações como:
   - Nome
   - Email
   - CPF
   - Perfil (admin/user)
   - Data de cadastro

#### Realizar Check-in
1. Acesse "Check-in" no menu
2. Escolha o método:
   - **Scanner QR Code:** Aponte a câmera para o QR
   - **Entrada Manual:** Digite o ID do crachá
3. Visualize a confirmação

#### Visualizar Estatísticas
1. No painel admin, vá para "Dashboard"
2. Visualize:
   - Total de eventos
   - Total de usuários
   - Inscrições ativas
   - Total de check-ins

---

## 5. Funcionalidades PWA

### Instalar como App

#### Android
1. Acesse o sistema no Chrome
2. Toque no menu (3 pontos)
3. Selecione "Adicionar à tela inicial"
4. Confirme a instalação

#### iOS
1. Acesse o sistema no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Confirme

#### Desktop
1. Acesse o sistema no Chrome/Edge
2. Clique no ícone de instalação na barra de endereço
3. Confirme a instalação
4. O app aparecerá como atalho

### Usar Offline
1. Com o app instalado
2. Ative o modo offline/avião
3. Abra o sistema
4. As páginas em cache funcionarão
5. Ao reconectar, os dados sincronizam

---

## 6. Dicas e Boas Práticas

### Para Participantes

✅ **Mantenha seu crachá acessível**
- Salve o QR Code na galeria
- Adicione o site à tela inicial
- Tenha uma cópia impressa como backup

✅ **Chegue cedo ao evento**
- O check-in é rápido, mas evite filas
- Tenha seu QR Code pronto

✅ **Avalie os eventos**
- Seu feedback é importante
- Ajuda a melhorar futuros eventos

✅ **Mantenha seus dados atualizados**
- Revise seu perfil periodicamente
- Exporte seus dados regularmente

### Para Administradores

✅ **Planeje com antecedência**
- Crie eventos com pelo menos 1 semana de antecedência
- Configure a capacidade máxima adequadamente

✅ **Monitore as inscrições**
- Acompanhe o número de inscritos
- Ajuste a capacidade se necessário

✅ **Teste o sistema de check-in**
- Faça testes antes do evento
- Treine a equipe de recepção

✅ **Analise as estatísticas**
- Use os relatórios para melhorar
- Identifique padrões de participação

---

## 7. Solução de Problemas

### Não consigo fazer login
1. Verifique se o email está correto
2. Use a opção "Esqueci minha senha"
3. Limpe o cache do navegador
4. Tente em modo anônimo

### Crachá não aparece
1. Verifique se sua inscrição foi aprovada
2. Aguarde alguns minutos e recarregue
3. Entre em contato com o administrador

### Scanner QR Code não funciona
1. Permita acesso à câmera
2. Certifique-se de boa iluminação
3. Use a entrada manual como alternativa
4. Tente outra câmera (frontal/traseira)

### Site não carrega
1. Verifique sua conexão com internet
2. Limpe o cache do navegador
3. Tente outro navegador
4. Verifique se o servidor está online

### Não consigo baixar o crachá
1. Permita downloads no navegador
2. Verifique espaço de armazenamento
3. Tente em outro dispositivo
4. Use a opção de impressão

---

## 8. Perguntas Frequentes (FAQ)

### Geral

**P: O sistema funciona offline?**
R: Sim, com o PWA instalado, muitas funcionalidades funcionam offline.

**P: Posso usar no celular?**
R: Sim, o sistema é totalmente responsivo e funciona em todos os dispositivos.

**P: É seguro?**
R: Sim, usamos criptografia e boas práticas de segurança.

### Eventos

**P: Posso me inscrever em vários eventos?**
R: Sim, não há limite de inscrições.

**P: Posso cancelar minha inscrição?**
R: Sim, desde que o evento ainda não tenha iniciado.

**P: Como sei se fui aprovado?**
R: Você receberá uma notificação e o status mudará para "Aprovado".

### Crachás

**P: Quando recebo meu crachá?**
R: Imediatamente após a aprovação da inscrição.

**P: O QR Code expira?**
R: Não, ele é válido até o fim do evento.

**P: Posso compartilhar meu crachá?**
R: Não, cada crachá é pessoal e intransferível.

### Check-in

**P: Posso fazer check-in antes do evento?**
R: Não, o check-in só é válido durante o período do evento.

**P: E se meu celular descarregar?**
R: Tenha uma cópia impressa ou informe seu ID manualmente.

**P: Posso fazer check-in múltiplas vezes?**
R: Não, apenas um check-in por evento.

---

## 9. Contato e Suporte

### Problemas Técnicos
- Consulte a documentação técnica
- Verifique os logs de erro
- Entre em contato com o suporte TI

### Dúvidas sobre Eventos
- Entre em contato com o organizador
- Acesse a página de detalhes do evento
- Verifique as informações do evento

### Feedback e Sugestões
- Use o sistema de avaliações
- Entre em contato com o administrador
- Contribua com melhorias

---

## 10. Recursos Adicionais

### Documentação
- `FUNCIONALIDADES_FRONTEND.md` - Documentação técnica
- `TESTES_REALIZADOS.md` - Relatório de testes
- `CHANGELOG.md` - Histórico de mudanças
- `README.md` - Instruções gerais

### Guias
- `guia_instalacao_windows.md` - Instalação no Windows
- `deploy-guide.md` - Guia de deploy
- `manual_usuario.md` - Manual do usuário

### Suporte
- Documentação online
- Suporte técnico
- Comunidade de usuários

---

## 11. Atalhos de Teclado

### Navegação
- `Tab` - Navegar entre campos
- `Enter` - Submeter formulários
- `Esc` - Fechar modais

### Busca
- Comece a digitar no campo de busca
- Resultados aparecem automaticamente

---

## 12. Melhores Práticas

### Segurança
- Não compartilhe suas credenciais
- Faça logout em computadores públicos
- Use senhas fortes
- Mantenha seus dados atualizados

### Performance
- Mantenha o app instalado
- Limpe o cache periodicamente
- Use conexão estável
- Feche abas não utilizadas

### Experiência
- Explore todas as funcionalidades
- Use os atalhos disponíveis
- Personalize suas preferências
- Dê feedback sobre o sistema

---

## Conclusão

O Sistema de Crachás Virtuais é uma plataforma completa e moderna para gestão de eventos. Com este guia, você tem todas as informações necessárias para usar o sistema de forma eficiente.

**Aproveite todas as funcionalidades e bom uso!** 🎉

---

**Versão:** 2.0.0
**Última Atualização:** Setembro 2025
**Status:** Produção

---

Para mais informações, consulte a documentação técnica ou entre em contato com o suporte.
