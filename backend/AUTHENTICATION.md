# Sistema de Autenticação - Ticket Robot

Este documento detalha como usar os endpoints de autenticação do Ticket Robot, incluindo exemplos práticos e fluxos de uso.

## 🔑 Visão Geral

O sistema implementa autenticação JWT multi-tenant com suporte a:

- Login/Registro de usuários
- Sistema de roles e permissões
- Multi-empresas (SaaS)
- Refresh tokens
- Troca de senha obrigatória no primeiro login
- Troca de contexto entre empresas

## 📋 Endpoints Disponíveis

### Base URL

```
http://localhost:3000/auth
```

### Documentação Swagger

Acesse a documentação interativa em: `http://localhost:3000/api`

## 🚀 Exemplos de Uso

### 1. Primeiro Acesso - Login com Conta Padrão

O sistema vem com uma conta de administrador pré-configurada:

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@ticketrobot.com",
  "password": "Admin123!"
}
```

**Resposta (200):**

```json
{
  "user": {
    "id": "clq1234567890abcdef",
    "email": "admin@ticketrobot.com",
    "name": "Administrador Sistema",
    "isFirstLogin": true
  },
  "company": {
    "id": "clq9876543210fedcba",
    "name": "Sistema Principal",
    "slug": "sistema-principal"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "role": {
    "name": "SUPER_ADMIN",
    "permissions": ["*"]
  }
}
```

> ⚠️ **Importante**: Note que `isFirstLogin: true`. Você deve trocar a senha antes de continuar.

### 2. Trocar Senha no Primeiro Login

```bash
POST /auth/change-first-login-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "Admin123!",
  "newPassword": "MinhaNovaSenh@456"
}
```

**Resposta (200):**

```json
{
  "message": "Senha alterada com sucesso",
  "user": {
    "id": "clq1234567890abcdef",
    "email": "admin@ticketrobot.com",
    "name": "Administrador Sistema",
    "isFirstLogin": false
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Registro de Nova Empresa

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "joao@minhaempresa.com",
  "password": "MinhaSenh@123",
  "name": "João Silva",
  "companyName": "Minha Empresa LTDA",
  "companySlug": "minha-empresa"
}
```

**Resposta (201):**

```json
{
  "user": {
    "id": "clq2345678901bcdefg",
    "email": "joao@minhaempresa.com",
    "name": "João Silva",
    "isFirstLogin": false
  },
  "company": {
    "id": "clq3456789012cdefgh",
    "name": "Minha Empresa LTDA",
    "slug": "minha-empresa"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "role": {
    "name": "COMPANY_OWNER",
    "permissions": ["manage_company", "manage_users", "view_reports"]
  }
}
```

### 4. Renovar Token de Acesso

```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. Obter Perfil do Usuário

```bash
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta (200):**

```json
{
  "userId": "clq1234567890abcdef",
  "email": "joao@minhaempresa.com",
  "companyId": "clq3456789012cdefgh",
  "roleName": "COMPANY_OWNER",
  "permissions": ["manage_company", "manage_users", "view_reports"],
  "user": {
    "id": "clq1234567890abcdef",
    "email": "joao@minhaempresa.com",
    "name": "João Silva",
    "avatar": null
  },
  "company": {
    "id": "clq3456789012cdefgh",
    "name": "Minha Empresa LTDA",
    "slug": "minha-empresa"
  }
}
```

### 6. Trocar Contexto de Empresa

Se o usuário pertence a múltiplas empresas:

```bash
POST /auth/change-company
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "companyId": "clq4567890123defghi"
}
```

**Resposta (200):**

```json
{
  "user": {
    "id": "clq1234567890abcdef",
    "email": "joao@minhaempresa.com",
    "name": "João Silva"
  },
  "company": {
    "id": "clq4567890123defghi",
    "name": "Outra Empresa LTDA",
    "slug": "outra-empresa"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "role": {
    "name": "MANAGER",
    "permissions": ["view_reports", "manage_tickets"]
  }
}
```

### 7. Logout

```bash
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta (200):**

```json
{
  "message": "Logout realizado com sucesso"
}
```

## 🛡️ Sistema de Roles e Permissões

### Roles Disponíveis

1. **SUPER_ADMIN**: Administrador do sistema

   - Permissões: `["*"]` (todas)

2. **COMPANY_OWNER**: Proprietário da empresa

   - Permissões: `["manage_company", "manage_users", "view_reports", "manage_tickets"]`

3. **MANAGER**: Gerente

   - Permissões: `["view_reports", "manage_tickets", "view_users"]`

4. **AGENT**: Agente de atendimento

   - Permissões: `["manage_tickets", "view_own_tickets"]`

5. **USER**: Usuário padrão
   - Permissões: `["view_own_tickets"]`

## 🔧 Usando os Tokens

### Header de Autorização

```
Authorization: Bearer {accessToken}
```

### Duração dos Tokens

- **Access Token**: 15 minutos
- **Refresh Token**: 7 dias

### Renovação Automática

O frontend deve implementar renovação automática do access token usando o refresh token quando receber erro 401.

## ❌ Códigos de Erro Comuns

### 400 - Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

### 401 - Unauthorized

```json
{
  "statusCode": 401,
  "message": "Email ou senha inválidos",
  "error": "Unauthorized"
}
```

### 409 - Conflict

```json
{
  "statusCode": 409,
  "message": "Email já está em uso",
  "error": "Conflict"
}
```

## 🔄 Fluxo Completo de Autenticação

1. **Primeiro Acesso**:

   - Login com conta padrão
   - Trocar senha obrigatória
   - Usar sistema normalmente

2. **Usuário Regular**:

   - Registro → Login automático
   - Usar tokens para acessar recursos protegidos
   - Renovar tokens quando necessário

3. **Multi-empresa**:
   - Login em uma empresa
   - Trocar contexto conforme necessário
   - Cada troca gera novos tokens

## 🧪 Testando com curl

### Exemplo completo de teste:

```bash
# 1. Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ticketrobot.com","password":"Admin123!"}')

# 2. Extrair token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken')

# 3. Testar endpoint protegido
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## 🔗 Próximos Passos

Após configurar a autenticação:

1. Integre o frontend com estes endpoints
2. Implemente renovação automática de tokens
3. Adicione interceptors para tratamento de erros
4. Configure redirecionamentos baseados em roles
5. Implemente logout automático na expiração dos tokens

---

Para mais detalhes sobre a implementação, consulte a documentação Swagger em `/api` ou o código fonte nos diretórios `src/auth/`.
