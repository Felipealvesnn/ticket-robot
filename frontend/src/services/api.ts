// Configuração base da API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// Configuração padrão para requests
const defaultHeaders = {
  "Content-Type": "application/json",
};

// Função helper para fazer requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Pegar token do localStorage se existir
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const config: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Se não for uma resposta ok, lançar erro
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    // Verificar se a resposta tem conteúdo
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================================================
// 🔐 AUTH API
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
  };
  access_token: string;
}

export interface VerifyResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
  };
}

export const authApi = {
  // Login do usuário
  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Verificar token
  verify: (): Promise<VerifyResponse> =>
    apiRequest<VerifyResponse>("/auth/verify"),

  // Logout (limpar sessão no backend)
  logout: (): Promise<void> =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
    }),

  // Registrar novo usuário
  register: (data: { name: string; email: string; password: string }) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Trocar senha
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// 📱 SESSIONS API
// ============================================================================

export interface Session {
  id: string;
  name: string;
  phoneNumber: string;
  status: "connected" | "disconnected" | "connecting";
  qrCode?: string;
  lastActivity: string;
}

export interface CreateSessionRequest {
  name: string;
  phoneNumber: string;
}

export const sessionsApi = {
  // Listar todas as sessões
  getAll: (): Promise<Session[]> => apiRequest<Session[]>("/sessions"),

  // Obter sessão específica
  getById: (id: string): Promise<Session> =>
    apiRequest<Session>(`/sessions/${id}`),

  // Criar nova sessão
  create: (data: CreateSessionRequest): Promise<Session> =>
    apiRequest<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Deletar sessão
  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/sessions/${id}`, {
      method: "DELETE",
    }),

  // Obter QR Code
  getQrCode: (id: string): Promise<{ qrCode: string }> =>
    apiRequest<{ qrCode: string }>(`/sessions/${id}/qr`),

  // Conectar sessão
  connect: (id: string): Promise<void> =>
    apiRequest<void>(`/sessions/${id}/connect`, {
      method: "POST",
    }),

  // Desconectar sessão
  disconnect: (id: string): Promise<void> =>
    apiRequest<void>(`/sessions/${id}/disconnect`, {
      method: "POST",
    }),
};

// ============================================================================
// 💬 MESSAGES API
// ============================================================================

export interface Message {
  id: string;
  sessionId: string;
  to: string;
  message: string;
  status: "sent" | "delivered" | "read" | "failed";
  createdAt: string;
}

export interface SendMessageRequest {
  sessionId: string;
  to: string;
  message: string;
}

export const messagesApi = {
  // Enviar mensagem
  send: (data: SendMessageRequest): Promise<Message> =>
    apiRequest<Message>("/messages/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Listar mensagens
  getAll: (sessionId?: string): Promise<Message[]> =>
    apiRequest<Message[]>(
      `/messages${sessionId ? `?sessionId=${sessionId}` : ""}`
    ),

  // Obter mensagem específica
  getById: (id: string): Promise<Message> =>
    apiRequest<Message>(`/messages/${id}`),
};

// ============================================================================
// 🔄 FLOWS API
// ============================================================================

export interface Flow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlowRequest {
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
}

export const flowsApi = {
  // Listar todos os flows
  getAll: (): Promise<Flow[]> => apiRequest<Flow[]>("/flows"),

  // Obter flow específico
  getById: (id: string): Promise<Flow> => apiRequest<Flow>(`/flows/${id}`),

  // Criar novo flow
  create: (data: CreateFlowRequest): Promise<Flow> =>
    apiRequest<Flow>("/flows", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar flow
  update: (id: string, data: Partial<CreateFlowRequest>): Promise<Flow> =>
    apiRequest<Flow>(`/flows/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Deletar flow
  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/flows/${id}`, {
      method: "DELETE",
    }),

  // Ativar/Desativar flow
  toggleActive: (id: string): Promise<Flow> =>
    apiRequest<Flow>(`/flows/${id}/toggle`, {
      method: "PATCH",
    }),
};

// ============================================================================
// 👥 CONTACTS API
// ============================================================================

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  tags: string[];
  lastInteraction: string;
}

export const contactsApi = {
  // Listar todos os contatos
  getAll: (): Promise<Contact[]> => apiRequest<Contact[]>("/contacts"),

  // Obter contato específico
  getById: (id: string): Promise<Contact> =>
    apiRequest<Contact>(`/contacts/${id}`),

  // Criar novo contato
  create: (data: Omit<Contact, "id" | "lastInteraction">): Promise<Contact> =>
    apiRequest<Contact>("/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar contato
  update: (id: string, data: Partial<Contact>): Promise<Contact> =>
    apiRequest<Contact>(`/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Deletar contato
  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/contacts/${id}`, {
      method: "DELETE",
    }),
};

// ============================================================================
// 📊 DASHBOARD API
// ============================================================================

export interface DashboardStats {
  sessions: number;
  messages: number;
  contacts: number;
  automations: number;
}

export interface Activity {
  id: string;
  action: string;
  time: string;
  type: "success" | "info" | "warning" | "error";
  icon: "plus" | "message" | "user" | "disconnect" | "settings";
}

export const dashboardApi = {
  // Obter estatísticas
  getStats: (): Promise<DashboardStats> =>
    apiRequest<DashboardStats>("/dashboard/stats"),

  // Obter atividades recentes
  getActivities: (): Promise<Activity[]> =>
    apiRequest<Activity[]>("/dashboard/activities"),

  // Obter status do sistema
  getSystemStatus: (): Promise<{
    isOnline: boolean;
    uptime: string;
    latency: string;
  }> => apiRequest("/dashboard/system-status"),
};

// ============================================================================
// 🔧 UTILITY FUNCTIONS
// ============================================================================

// Interceptor global para erros de autenticação
export function setupApiInterceptors() {
  // Esta função pode ser chamada no início da aplicação
  // para configurar interceptors globais se necessário
}

// Helper para upload de arquivos
export async function uploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return apiRequest(endpoint, {
    method: "POST",
    body: formData,
    headers: {}, // Remover Content-Type para FormData
  });
}

export default {
  auth: authApi,
  sessions: sessionsApi,
  messages: messagesApi,
  flows: flowsApi,
  contacts: contactsApi,
  dashboard: dashboardApi,
};
