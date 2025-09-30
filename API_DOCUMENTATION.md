# Documentação da API - Sistema de Crachás Virtuais

**Versão:** 2.0.0
**Base URL:** `http://localhost:3000/api`

---

## Índice

1. [Autenticação](#autenticação)
2. [Usuários](#usuários)
3. [Eventos](#eventos)
4. [Inscrições](#inscrições)
5. [Crachás](#crachás)
6. [Check-ins](#check-ins)
7. [Avaliações](#avaliações)
8. [Premiações](#premiações)
9. [Relatórios](#relatórios)

---

## Autenticação

Todos os endpoints protegidos requerem um token JWT no header:
```
Authorization: Bearer <token>
```

### POST /api/auth/register
Registrar novo usuário

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "cpf": "12345678900",
  "phone": "11999999999",
  "address": "Rua Exemplo, 123"
}
```

**Response:** `201 Created`
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "user"
  },
  "token": "jwt_token"
}
```

---

### POST /api/auth/login
Fazer login

**Request Body:**
```json
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "user"
  },
  "token": "jwt_token"
}
```

---

### POST /api/auth/logout
Fazer logout (apenas limpa token no client)

**Response:** `200 OK`
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## Usuários

### GET /api/users
Listar todos os usuários (Admin only)

**Query Parameters:**
- `page` (opcional): Número da página (default: 1)
- `limit` (opcional): Itens por página (default: 10)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678900",
    "phone": "11999999999",
    "role": "user",
    "createdAt": "2025-09-30T00:00:00.000Z"
  }
]
```

---

### GET /api/users/:id
Obter detalhes de um usuário

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@example.com",
  "cpf": "12345678900",
  "phone": "11999999999",
  "address": "Rua Exemplo, 123",
  "role": "user",
  "createdAt": "2025-09-30T00:00:00.000Z"
}
```

---

### PUT /api/users/:id
Atualizar usuário

**Request Body:**
```json
{
  "name": "João Silva Atualizado",
  "phone": "11988888888",
  "address": "Nova Rua, 456"
}
```

**Response:** `200 OK`
```json
{
  "message": "Usuário atualizado com sucesso",
  "user": { ... }
}
```

---

## Eventos

### GET /api/events
Listar eventos

**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `search` (opcional): Buscar por título, descrição ou local
- `upcoming` (opcional): `true` para eventos futuros

**Response:** `200 OK`
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Workshop de React",
      "description": "Aprenda React do zero",
      "location": "Online",
      "startDate": "2025-10-15T10:00:00.000Z",
      "endDate": "2025-10-15T18:00:00.000Z",
      "maxAttendees": 50,
      "createdAt": "2025-09-30T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10,
    "limit": 10
  }
}
```

---

### GET /api/events/:id
Obter detalhes de um evento

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Workshop de React",
  "description": "Aprenda React do zero",
  "location": "Online",
  "startDate": "2025-10-15T10:00:00.000Z",
  "endDate": "2025-10-15T18:00:00.000Z",
  "maxAttendees": 50,
  "imageUrl": "/uploads/events/image.jpg",
  "createdAt": "2025-09-30T00:00:00.000Z"
}
```

---

### POST /api/events
Criar evento (Admin only)

**Request Body:**
```json
{
  "title": "Workshop de React",
  "description": "Aprenda React do zero",
  "location": "Online",
  "startDate": "2025-10-15T10:00:00.000Z",
  "endDate": "2025-10-15T18:00:00.000Z",
  "maxAttendees": 50
}
```

**Response:** `201 Created`
```json
{
  "message": "Evento criado com sucesso",
  "event": { ... }
}
```

---

### PUT /api/events/:id
Atualizar evento (Admin only)

**Request Body:**
```json
{
  "title": "Workshop de React Avançado",
  "maxAttendees": 100
}
```

**Response:** `200 OK`
```json
{
  "message": "Evento atualizado com sucesso",
  "event": { ... }
}
```

---

### DELETE /api/events/:id
Excluir evento (Admin only)

**Response:** `200 OK`
```json
{
  "message": "Evento excluído com sucesso"
}
```

---

## Inscrições

### POST /api/enrollments
Inscrever-se em um evento

**Request Body:**
```json
{
  "eventId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "message": "Inscrição realizada com sucesso",
  "enrollment": {
    "id": "uuid",
    "eventId": "uuid",
    "userId": "uuid",
    "status": "PENDING",
    "enrollmentDate": "2025-09-30T00:00:00.000Z"
  }
}
```

---

### GET /api/enrollments
Listar inscrições do usuário logado

**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `status` (opcional): Filtrar por status (PENDING, CONFIRMED, CANCELLED)

**Response:** `200 OK`
```json
{
  "enrollments": [
    {
      "id": "uuid",
      "status": "CONFIRMED",
      "enrollmentDate": "2025-09-30T00:00:00.000Z",
      "event": {
        "id": "uuid",
        "title": "Workshop de React",
        "description": "...",
        "startDate": "2025-10-15T10:00:00.000Z",
        "location": "Online"
      },
      "badge": {
        "id": "uuid",
        "qrCodeUrl": "/uploads/qrcodes/badge_xxx.png"
      }
    }
  ],
  "pagination": { ... }
}
```

---

### GET /api/enrollments/event/:eventId/status
Verificar status de inscrição em um evento

**Response:** `200 OK`
```json
{
  "enrolled": true,
  "enrollmentId": "uuid",
  "status": "CONFIRMED",
  "badge": {
    "id": "uuid",
    "qrCodeUrl": "/uploads/qrcodes/badge_xxx.png"
  },
  "enrollmentCount": 25
}
```

---

### DELETE /api/enrollments/:id
Cancelar inscrição

**Response:** `200 OK`
```json
{
  "message": "Inscrição cancelada com sucesso"
}
```

---

## Crachás

### GET /api/badges/my-badges
Listar crachás do usuário logado

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "qrCodeUrl": "/uploads/qrcodes/badge_xxx.png",
      "createdAt": "2025-09-30T00:00:00.000Z",
      "enrollment": {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "name": "João Silva",
          "email": "joao@example.com",
          "photoUrl": null
        },
        "event": {
          "id": "uuid",
          "title": "Workshop de React",
          "description": "...",
          "location": "Online",
          "startDate": "2025-10-15T10:00:00.000Z",
          "endDate": "2025-10-15T18:00:00.000Z"
        }
      }
    }
  ]
}
```

---

### GET /api/badges/:id
Obter detalhes de um crachá

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "qrCodeUrl": "/uploads/qrcodes/badge_xxx.png",
  "enrollment": { ... },
  "checkin": {
    "id": "uuid",
    "checkinDate": "2025-10-15T10:30:00.000Z"
  }
}
```

---

### GET /api/badges/:id/download
Baixar imagem do crachá

**Response:** `200 OK` (arquivo PNG)

---

## Check-ins

### POST /api/checkins
Realizar check-in

**Request Body:**
```json
{
  "badgeId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "message": "Check-in realizado com sucesso",
  "checkin": {
    "id": "uuid",
    "badgeId": "uuid",
    "checkinDate": "2025-10-15T10:30:00.000Z"
  },
  "badge": {
    "id": "uuid",
    "user": {
      "name": "João Silva"
    },
    "enrollment": {
      "event": {
        "title": "Workshop de React"
      }
    }
  }
}
```

---

### GET /api/checkins/my
Listar check-ins do usuário logado

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "checkinDate": "2025-10-15T10:30:00.000Z",
    "badge": {
      "enrollment": {
        "event": {
          "title": "Workshop de React"
        }
      }
    }
  }
]
```

---

## Avaliações

### POST /api/evaluations
Criar avaliação de evento

**Request Body:**
```json
{
  "eventId": "uuid",
  "rating": 5,
  "comment": "Excelente evento!"
}
```

**Response:** `201 Created`
```json
{
  "message": "Avaliação criada com sucesso",
  "evaluation": {
    "id": "uuid",
    "enrollmentId": "uuid",
    "rating": 5,
    "comment": "Excelente evento!",
    "createdAt": "2025-10-15T19:00:00.000Z"
  }
}
```

---

### GET /api/evaluations/my
Listar avaliações do usuário logado

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "rating": 5,
    "comment": "Excelente evento!",
    "createdAt": "2025-10-15T19:00:00.000Z",
    "enrollmentId": "uuid",
    "enrollment": {
      "event": {
        "id": "uuid",
        "title": "Workshop de React"
      }
    }
  }
]
```

---

### GET /api/evaluations/events/:eventId
Listar avaliações de um evento (Admin only)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "rating": 5,
    "comment": "Excelente evento!",
    "enrollment": {
      "user": {
        "name": "João Silva"
      }
    }
  }
]
```

---

## Premiações

### GET /api/awards
Listar todas as premiações disponíveis

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Participante Assíduo",
    "description": "Participou de 5 eventos",
    "criteria": "5 check-ins",
    "imageUrl": "/uploads/awards/badge.png"
  }
]
```

---

### GET /api/awards/user/:userId
Listar premiações de um usuário

**Response:** `200 OK`
```json
{
  "userAwards": [
    {
      "id": "uuid",
      "awardedAt": "2025-10-15T00:00:00.000Z",
      "award": {
        "name": "Participante Assíduo",
        "description": "Participou de 5 eventos"
      }
    }
  ]
}
```

---

## Relatórios

### GET /api/reports/statistics
Obter estatísticas gerais (Admin only)

**Response:** `200 OK`
```json
{
  "totalEvents": 50,
  "totalUsers": 500,
  "activeEnrollments": 150,
  "totalCheckins": 300,
  "averageRating": 4.5
}
```

---

### GET /api/reports/events/:eventId
Obter relatório de um evento (Admin only)

**Response:** `200 OK`
```json
{
  "event": {
    "id": "uuid",
    "title": "Workshop de React"
  },
  "enrollments": {
    "total": 30,
    "confirmed": 25,
    "pending": 5
  },
  "checkins": {
    "total": 20,
    "percentage": 80
  },
  "evaluations": {
    "total": 18,
    "averageRating": 4.7
  }
}
```

---

## Códigos de Status HTTP

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: avaliação duplicada)
- `500 Internal Server Error` - Erro no servidor

---

## Autenticação e Autorização

### Níveis de Acesso

**Público:**
- POST /api/auth/register
- POST /api/auth/login

**Autenticado (user):**
- Todos os endpoints de usuário logado
- GET, POST endpoints de eventos, inscrições, crachás
- POST /api/checkins
- POST /api/evaluations

**Administrador (admin):**
- Todos os endpoints de usuário
- POST, PUT, DELETE /api/events
- GET estatísticas e relatórios
- Gerenciamento de usuários

---

## Paginação

Endpoints que suportam paginação retornam:

```json
{
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10,
    "limit": 10
  }
}
```

**Query Parameters:**
- `page`: Número da página (default: 1)
- `limit`: Itens por página (default: 10, max: 100)

---

## Exemplos de Uso

### Fluxo Completo de Participante

```bash
# 1. Registrar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@test.com","password":"123456","cpf":"12345678900"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@test.com","password":"123456"}'

# 3. Listar eventos
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer <token>"

# 4. Inscrever-se
curl -X POST http://localhost:3000/api/enrollments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"uuid"}'

# 5. Ver crachás
curl -X GET http://localhost:3000/api/badges/my-badges \
  -H "Authorization: Bearer <token>"

# 6. Check-in (no dia do evento)
curl -X POST http://localhost:3000/api/checkins \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"badgeId":"uuid"}'

# 7. Avaliar evento
curl -X POST http://localhost:3000/api/evaluations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"uuid","rating":5,"comment":"Ótimo!"}'
```

---

## Notas Importantes

1. **Tokens JWT**: Expiram em 24 horas
2. **Validação**: Todos os campos obrigatórios são validados
3. **Segurança**: Senhas são hasheadas com bcrypt
4. **CORS**: Configurado para aceitar requisições do frontend
5. **Rate Limiting**: Não implementado (recomendado para produção)
6. **Upload de Arquivos**: Suportado via multipart/form-data
7. **QR Codes**: Gerados automaticamente ao criar crachá

---

**Documentação Atualizada:** Setembro 2025
**Versão da API:** 2.0.0
