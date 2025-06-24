# 🔌 Serviço de API Centralizado

## 📋 **Por que criar um serviço de API?**

### **❌ ANTES (Problemático):**

```tsx
// Em vários lugares do código...
await fetch("/api/auth/login", { ... })        // ❌ URL hardcoded
await fetch("http://localhost:3000/sessions")  // ❌ URL hardcoded
await fetch("/api/messages/send", { ... })     // ❌ Duplicação de lógica
```

### **✅ AGORA (Centralizado):**

```tsx
// Em qualquer lugar do código...
await authApi.login({ email, password }); // ✅ Função tipada
await sessionsApi.getAll(); // ✅ Autocomplete
await messagesApi.send({ to, message }); // ✅ TypeScript
```

## 🚀 **Vantagens da Abordagem:**

### **1. Centralização**

- Todas as URLs em um só lugar
- Mudança de endpoint afeta apenas 1 arquivo
- Configuração padrão compartilhada

### **2. Tipagem TypeScript**

- Intellisense completo
- Validação em tempo de compilação
- Interfaces bem definidas

### **3. Reutilização**

- Mesmo código para auth em stores e componentes
- Lógica de erro centralizada
- Headers automáticos (Authorization)

### **4. Manutenibilidade**

- Fácil de testar (mock apenas 1 arquivo)
- Versionamento de API simplificado
- Debugging centralizado

## 📚 **Como usar em qualquer lugar:**

### **🔐 Autenticação:**

```tsx
import { authApi } from "@/services/api";

// Login
const loginUser = async () => {
  try {
    const result = await authApi.login({ email, password });
    console.log("Usuário logado:", result.user);
  } catch (error) {
    console.error("Erro no login:", error.message);
  }
};

// Verificar token
const checkToken = async () => {
  try {
    const result = await authApi.verify();
    return result.user;
  } catch (error) {
    return null; // Token inválido
  }
};
```

### **📱 Sessões WhatsApp:**

```tsx
import { sessionsApi } from "@/services/api";

// Listar sessões
const loadSessions = async () => {
  const sessions = await sessionsApi.getAll();
  return sessions;
};

// Criar sessão
const createSession = async () => {
  const newSession = await sessionsApi.create({
    name: "Vendas Bot",
    phoneNumber: "+5511999999999",
  });
  return newSession;
};

// Obter QR Code
const getQR = async (sessionId: string) => {
  const { qrCode } = await sessionsApi.getQrCode(sessionId);
  return qrCode;
};
```

### **💬 Mensagens:**

```tsx
import { messagesApi } from "@/services/api";

// Enviar mensagem
const sendMessage = async () => {
  const message = await messagesApi.send({
    sessionId: "session-123",
    to: "5511999999999",
    message: "Olá! Como posso ajudar?",
  });
  return message;
};

// Buscar histórico
const getHistory = async (sessionId: string) => {
  const messages = await messagesApi.getAll(sessionId);
  return messages;
};
```

### **🔄 Flows:**

```tsx
import { flowsApi } from "@/services/api";

// Listar flows
const loadFlows = async () => {
  const flows = await flowsApi.getAll();
  return flows;
};

// Salvar flow
const saveFlow = async (flowData) => {
  const flow = await flowsApi.create({
    name: "Atendimento Automático",
    description: "Flow para atendimento inicial",
    nodes: flowData.nodes,
    edges: flowData.edges,
  });
  return flow;
};
```

### **📊 Dashboard:**

```tsx
import { dashboardApi } from "@/services/api";

// Buscar estatísticas
const loadDashboard = async () => {
  const [stats, activities, status] = await Promise.all([
    dashboardApi.getStats(),
    dashboardApi.getActivities(),
    dashboardApi.getSystemStatus(),
  ]);

  return { stats, activities, status };
};
```

## 🛠️ **Configuração Automática:**

### **Headers Automáticos:**

```tsx
// Token é adicionado automaticamente em todas as requisições
const sessions = await sessionsApi.getAll();
// ↑ Inclui: Authorization: Bearer <token>
```

### **URL Base:**

```tsx
// Configurada via .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000

// Usada automaticamente em todas as chamadas
authApi.login() // → http://localhost:3000/auth/login
sessionsApi.getAll() // → http://localhost:3000/sessions
```

### **Tratamento de Erros:**

```tsx
// Errors são automaticamente capturados e formatados
try {
  await authApi.login({ email: "invalid", password: "wrong" });
} catch (error) {
  console.log(error.message); // "Email ou senha incorretos"
}
```

## 🎯 **Exemplo Completo em um Store:**

```tsx
import { create } from "zustand";
import { sessionsApi } from "@/services/api";

interface SessionsState {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;

  loadSessions: () => Promise<void>;
  createSession: (data: CreateSessionRequest) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  loadSessions: async () => {
    try {
      set({ isLoading: true, error: null });
      const sessions = await sessionsApi.getAll(); // ✅ Usa o serviço
      set({ sessions, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createSession: async (data) => {
    try {
      set({ isLoading: true });
      const newSession = await sessionsApi.create(data); // ✅ Usa o serviço
      const { sessions } = get();
      set({
        sessions: [...sessions, newSession],
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteSession: async (id) => {
    try {
      await sessionsApi.delete(id); // ✅ Usa o serviço
      const { sessions } = get();
      set({
        sessions: sessions.filter((s) => s.id !== id),
      });
    } catch (error) {
      set({ error: error.message });
    }
  },
}));
```

## 🔧 **Upload de Arquivos:**

```tsx
import { uploadFile } from "@/services/api";

// Upload de imagem
const uploadImage = async (file: File) => {
  try {
    const result = await uploadFile("/upload/image", file, {
      category: "profile",
      userId: "123",
    });
    return result.url;
  } catch (error) {
    console.error("Erro no upload:", error);
  }
};
```

## 🎉 **Resultado:**

- **DRY**: Não repete código
- **Type Safe**: TypeScript completo
- **Maintainable**: Fácil de manter
- **Testable**: Simples de testar
- **Scalable**: Cresce com o projeto

**Agora você tem um sistema de API robusto e profissional!** 🚀✨
