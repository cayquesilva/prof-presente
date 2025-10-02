# Guia de Testes - Novas Implementações

## ✅ O que foi implementado:

### 1. Sistema de Avaliação de Eventos
**Funcionalidade:** Usuários podem avaliar eventos após sua conclusão

**Como testar:**
1. Faça login no sistema
2. Vá para "Minhas Inscrições"
3. Encontre um evento com status "Aprovada" que já terminou
4. Clique no botão "Avaliar"
5. Selecione de 1 a 5 estrelas
6. Adicione um comentário (opcional)
7. Envie a avaliação

**Resultado esperado:**
- Avaliação deve ser salva com sucesso
- Botão "Avaliar" desaparece após avaliação
- Mensagem de sucesso é exibida

---

### 2. Ranking de Check-ins Corrigido
**Funcionalidade:** Ranking agora mostra corretamente os check-ins com crachá universal

**Como testar:**
1. Faça check-in em um evento usando seu crachá universal
2. Vá para "Ranking Professores"
3. Verifique se seu nome aparece no ranking

**Resultado esperado:**
- Usuários com check-ins aparecem no ranking
- Contagem de check-ins está correta
- Ordenação por número de check-ins funciona

---

### 3. Permissão de Inscrição Estendida
**Funcionalidade:** Inscrições permitidas até o término do evento

**Como testar:**
1. Tente se inscrever em um evento que já começou mas ainda não terminou
2. A inscrição deve ser permitida

**Resultado esperado:**
- Inscrição é aceita para eventos em andamento
- Inscrição é bloqueada apenas após o término do evento

---

### 4. Controle de Acesso ao Check-in
**Funcionalidade:** Apenas ADMIN e CHECKIN_COORDINATOR podem fazer check-in

**Como testar:**
1. **Como usuário normal (USER):**
   - O menu "Check-in" NÃO deve aparecer na navegação
   - Tentativas de acessar `/check-in` diretamente devem ser bloqueadas

2. **Como ADMIN:**
   - Menu "Check-in" deve aparecer
   - Pode realizar check-ins normalmente

**Resultado esperado:**
- Usuários sem permissão não veem o menu
- Apenas ADMIN e CHECKIN_COORDINATOR podem fazer check-ins

---

### 5. Novos Tipos de Usuário
**Funcionalidade:** Sistema suporta novos roles

**Tipos disponíveis:**
- `ADMIN` - Administrador com acesso total
- `ORGANIZER` - Organizador de eventos
- `CHECKIN_COORDINATOR` - Coordenador de check-in
- `TEACHER` - Professor
- `USER` - Usuário padrão

**Como testar:**
- Os novos tipos serão usados na interface de gerenciamento de usuários (próxima implementação)

---

### 6. Sistema de Localidades de Trabalho (Workplaces)
**Funcionalidade:** CRUD completo de localidades + importação CSV

**Endpoints disponíveis:**
```
GET    /api/workplaces           - Listar localidades
GET    /api/workplaces/:id       - Obter localidade por ID
POST   /api/workplaces           - Criar localidade (ADMIN)
PUT    /api/workplaces/:id       - Atualizar localidade (ADMIN)
DELETE /api/workplaces/:id       - Deletar localidade (ADMIN)
POST   /api/workplaces/import/csv - Importar CSV (ADMIN)
```

**Como testar via API (usando Postman/Insomnia):**

1. **Criar localidade:**
```json
POST /api/workplaces
Authorization: Bearer {seu_token_admin}
Content-Type: application/json

{
  "name": "Escola Municipal João Silva",
  "description": "Escola central",
  "city": "São Paulo",
  "state": "SP"
}
```

2. **Listar localidades:**
```
GET /api/workplaces?page=1&limit=10
Authorization: Bearer {seu_token}
```

3. **Importar CSV:**
```
POST /api/workplaces/import/csv
Authorization: Bearer {seu_token_admin}
Content-Type: multipart/form-data
file: [arquivo.csv]
```

**Formato do CSV:**
```csv
name,description,city,state
Escola A,Descrição A,São Paulo,SP
Escola B,Descrição B,Rio de Janeiro,RJ
Escola C,Descrição C,Belo Horizonte,MG
```

**Resultado esperado:**
- Localidades são criadas corretamente
- Listagem funciona com filtros e paginação
- Importação CSV processa múltiplos registros
- Não permite deletar localidades com usuários associados

---

## 🔧 Inicialização do Sistema

### Backend:
```bash
cd cracha-virtual-system
npm install
npx prisma generate
npm run dev
```

### Frontend:
```bash
cd cracha-virtual-frontend
npm install
npm run dev
```

---

## 📋 Checklist de Testes

- [ ] Sistema de avaliação funcionando
- [ ] Ranking de check-ins mostrando dados corretos
- [ ] Inscrições permitidas até fim do evento
- [ ] Menu check-in oculto para usuários sem permissão
- [ ] API de workplaces respondendo corretamente
- [ ] Importação CSV de localidades funcionando

---

## 🐛 Problemas Conhecidos

Se encontrar o erro relacionado aos novos enums (ORGANIZER, CHECKIN_COORDINATOR), execute:

```sql
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ORGANIZER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CHECKIN_COORDINATOR';
```

Ou reinicie o banco de dados com:
```bash
docker-compose down
docker-compose up -d
```

---

## 📝 Próximas Implementações (Aguardando Teste)

1. Interface Admin para gerenciar usuários
2. Função de redefinir senha
3. Adicionar workplace no formulário de registro
4. Dashboards de relatórios por evento
5. Renomear "badge" para "insígnia"
6. Mover crachá para perfil do usuário
7. Redesign do crachá (frente/verso)
8. Suporte para wallets iOS/Android

---

## 💬 Feedback

Após testar, informe:
1. Quais funcionalidades estão funcionando corretamente?
2. Quais apresentaram problemas?
3. Pode prosseguir com as próximas implementações?
