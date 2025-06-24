# Ticket Robot - Sistema de Login e Autenticação

## Configuração de Autenticação

Este projeto implementa um sistema completo de autenticação com as seguintes características:

### Arquitetura de Autenticação

1. **Backend (NestJS)**:

   - Endpoint `/auth/login` para autenticação
   - JWT tokens com expiração configurável
   - Guards para proteção de rotas
   - Middleware de verificação de token

2. **Frontend (Next.js)**:
   - Middleware para proteção de rotas
   - Contexto de autenticação global
   - Cookies httpOnly para segurança
   - Redirecionamento automático

### Componentes Principais

#### Backend

- `auth.controller.ts` - Endpoints de autenticação
- `auth.service.ts` - Lógica de login/verificação
- `jwt.strategy.ts` - Estratégia JWT
- `jwt-auth.guard.ts` - Guard para proteção

#### Frontend

- `AuthContext.tsx` - Contexto global de autenticação
- `middleware.ts` - Middleware de proteção de rotas
- `login/page.tsx` - Página de login
- `ProtectedRoute.tsx` - Componente para proteger páginas
- `/api/auth/*` - API routes para integração

### Fluxo de Autenticação

1. **Login**:

   ```
   Frontend -> API Route (/api/auth/login) -> Backend (/auth/login)
   ```

2. **Verificação**:

   ```
   Middleware -> Cookie httpOnly -> Backend (/auth/verify)
   ```

3. **Proteção**:
   ```
   Middleware -> Verifica token -> Redireciona se necessário
   ```

### Configuração de Ambiente

#### Frontend (.env.local)

```bash
PORT=3005
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3005
NEXTAUTH_SECRET=your-super-secret-jwt-key
NEXTAUTH_URL=http://localhost:3005
```

#### Backend (.env)

```bash
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3005
```

### Rotas Protegidas

As seguintes rotas são automaticamente protegidas pelo middleware:

- `/` (Dashboard)
- `/dashboard`
- `/sessions`
- `/flows`
- `/contacts`
- `/tickets`
- `/settings`

### Rotas de Autenticação

As seguintes rotas são apenas para usuários não autenticados:

- `/login`
- `/register`
- `/forgot-password`

### Como Funciona

1. **Acesso à aplicação**: Se não estiver logado, é redirecionado para `/login`
2. **Login**: Credenciais são enviadas para o backend via API route
3. **Token**: JWT é retornado e armazenado em cookie httpOnly
4. **Navegação**: Middleware verifica o token em todas as rotas protegidas
5. **Logout**: Remove o token e redireciona para login

### Segurança

- **Cookies httpOnly**: Previne acesso via JavaScript
- **JWT com expiração**: Tokens têm tempo limitado
- **Middleware de verificação**: Valida tokens em tempo real
- **CORS configurado**: Apenas frontend autorizado pode acessar backend
- **Validação de rotas**: Proteção automática de todas as rotas sensíveis

### Comandos para Desenvolvimento

```bash
# Backend (porta 3000)
cd backend
npm run start:dev

# Frontend (porta 3005)
cd frontend
npm run dev
```

### Usuário Padrão

Para desenvolvimento, use as credenciais:

- Email: admin@ticketrobot.com
- Senha: 123456

_Nota: Este usuário deve ser criado no banco de dados ou via endpoint de registro._
