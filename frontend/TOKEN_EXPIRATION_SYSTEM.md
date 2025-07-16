# 🔒 Sistema de Detecção de Token Expirado

## 🎯 Problema Resolvido

Quando o usuário fica na tela de conversas sem atualizar a página e o token JWT expira, ele continuava tentando enviar mensagens e recebia apenas erros. Agora o sistema detecta automaticamente quando o token expira e redireciona para o login.

## 🔧 Como Funciona

### 1. **Interceptor de API** (`services/api.ts`)

```typescript
// Detecta qualquer resposta HTTP 401 (Unauthorized)
if (response.status === 401) {
  console.warn("🔒 Token expirado detectado, redirecionando para login...");
  handleTokenExpired();
  throw new Error("Token expirado. Redirecionando para login...");
}
```

### 2. **Função handleTokenExpired** (`services/api.ts`)

```typescript
const handleTokenExpired = () => {
  // 1. Mostrar toast de notificação
  toast.error("Sessão expirada. Redirecionando para login...");

  // 2. Limpar localStorage
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth-storage");

  // 3. Disparar evento customizado
  window.dispatchEvent(new CustomEvent("authTokenExpired"));

  // 4. Fallback com window.location
  setTimeout(() => {
    window.location.href = "/login";
  }, 1500);
};
```

### 3. **AuthProvider** (`components/AuthProvider.tsx`)

```typescript
// Escuta o evento customizado e usa o router do Next.js
useEffect(() => {
  const handleTokenExpired = () => {
    console.log("🔒 Token expirado detectado, redirecionando para login...");
    router.push("/login"); // Navegação SPA sem reload
  };

  window.addEventListener("authTokenExpired", handleTokenExpired);

  return () => {
    window.removeEventListener("authTokenExpired", handleTokenExpired);
  };
}, [router]);
```

## 🎊 Benefícios

### ✅ **Detecção Automática**

- Funciona em **qualquer requisição** da API
- Não precisa de verificação manual
- Intercepta **todos os erros 401**

### ✅ **Navegação Suave**

- Usa `router.push()` do Next.js (SPA)
- Fallback com `window.location.href` se necessário
- Sem reload desnecessário da página

### ✅ **UX Melhorada**

- Toast informa o usuário sobre a expiração
- Redirecionamento automático e rápido
- Usuário não fica travado com erros

### ✅ **Cobertura Completa**

- Envio de mensagens
- Carregamento de tickets
- Qualquer operação da API
- Funciona em todas as telas

## 🚀 Funcionamento Prático

### Cenário:

1. Usuário fica 2 horas na tela de conversas
2. Token JWT expira após 1 hora
3. Usuário tenta enviar uma mensagem
4. API retorna 401 → **Interceptor detecta**
5. **Toast aparece**: "Sessão expirada..."
6. **AuthProvider** recebe evento → **router.push("/login")**
7. Usuário é redirecionado suavemente para login

## 🔧 Configuração

O sistema funciona automaticamente, não precisa de configuração adicional. Está integrado em:

- ✅ `services/api.ts` - Interceptor
- ✅ `components/AuthProvider.tsx` - Listener
- ✅ `react-toastify` - Notificações
- ✅ `next/navigation` - Roteamento

## 🎯 Resultado

**Antes**: Usuário ficava travado com erros de requisição  
**Depois**: Redirecionamento automático e suave para login 🎉
