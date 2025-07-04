// Configuração base da API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// Configuração padrão para requests
const defaultHeaders = {
  "Content-Type": "application/json",
};

// Importar todos os types
import * as Types from "@/types";

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

export const authApi = {
  // Login do usuário
  login: (data: Types.LoginRequest): Promise<Types.LoginResponse> =>
    apiRequest<Types.LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Verificar token
  verify: (): Promise<Types.VerifyResponse> =>
    apiRequest<Types.VerifyResponse>("/auth/verify"),

  // Logout (limpar sessão no backend)
  logout: (): Promise<void> =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
    }),

  // Registrar novo usuário
  register: (data: Types.RegisterRequest): Promise<Types.RegisterResponse> =>
    apiRequest<Types.RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Trocar senha
  changePassword: (
    data: Types.ChangePasswordRequest
  ): Promise<Types.ChangePasswordResponse> =>
    apiRequest<Types.ChangePasswordResponse>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Trocar senha no primeiro login
  changeFirstLoginPassword: (
    currentPassword: string,
    newPassword: string
  ): Promise<{
    message: string;
    user: Types.AuthUser;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> =>
    apiRequest("/auth/change-first-login-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    }),

  // Refresh token (com opção de trocar empresa)
  refresh: (
    refreshToken: string,
    companyId?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> =>
    apiRequest("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        refreshToken,
        ...(companyId && { companyId }),
      }),
    }),
};

// ============================================================================
// 📱 SESSIONS API
// ============================================================================

export const sessionsApi = {
  // Listar todas as sessões
  getAll: (): Promise<Types.Session[]> =>
    apiRequest<{ total: number; sessions: Types.Session[] }>("/session").then(
      (response) => response.sessions
    ),

  // Obter sessão específica
  getById: (id: string): Promise<Types.SessionResponse> =>
    apiRequest<Types.SessionResponse>(`/session/${id}`),

  // Criar nova sessão
  create: (data: Types.CreateSessionRequest): Promise<Types.SessionResponse> =>
    apiRequest<Types.SessionResponse>("/session", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar sessão
  update: (
    id: string,
    data: Types.UpdateSessionRequest
  ): Promise<Types.SessionResponse> =>
    apiRequest<Types.SessionResponse>(`/session/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Deletar sessão
  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/session/${id}`, {
      method: "DELETE",
    }),

  // Obter QR Code
  getQrCode: (id: string): Promise<Types.QrCodeResponse> =>
    apiRequest<Types.QrCodeResponse>(`/session/${id}/qr`),

  // Reiniciar sessão (em vez de connect/disconnect separados)
  restart: (id: string): Promise<Types.SessionResponse> =>
    apiRequest<Types.SessionResponse>(`/session/${id}/restart`, {
      method: "POST",
    }),

  // Obter status da sessão
  getStatus: (id: string): Promise<Types.SessionStatusResponse> =>
    apiRequest<Types.SessionStatusResponse>(`/session/${id}/status`),
};

// ============================================================================
// 💬 MESSAGES API
// ============================================================================

export const messagesApi = {
  // Enviar mensagem
  send: (data: Types.SendMessageRequest): Promise<Types.SendMessageResponse> =>
    apiRequest<Types.SendMessageResponse>("/messages/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Listar mensagens
  getAll: (
    filters?: Types.MessageFilters
  ): Promise<Types.MessagesListResponse> =>
    apiRequest<Types.MessagesListResponse>("/messages", {
      method: "POST",
      body: JSON.stringify(filters || {}),
    }),

  // Obter mensagem específica
  getById: (id: string): Promise<Types.Message> =>
    apiRequest<Types.Message>(`/messages/${id}`),

  // Marcar como lida
  markAsRead: (id: string): Promise<void> =>
    apiRequest<void>(`/messages/${id}/read`, {
      method: "PATCH",
    }),
};

// ============================================================================
// 🔄 FLOWS API
// ============================================================================

export const flowsApi = {
  // Listar todos os flows
  getAll: (): Promise<Types.Flow[]> => apiRequest<Types.Flow[]>("/flows"),

  // Obter flow específico
  getById: (id: string): Promise<Types.FlowResponse> =>
    apiRequest<Types.FlowResponse>(`/flows/${id}`),

  // Criar novo flow
  create: (data: Types.CreateFlowRequest): Promise<Types.FlowResponse> =>
    apiRequest<Types.FlowResponse>("/flows", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar flow
  update: (
    id: string,
    data: Types.UpdateFlowRequest
  ): Promise<Types.FlowResponse> =>
    apiRequest<Types.FlowResponse>(`/flows/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Deletar flow
  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/flows/${id}`, {
      method: "DELETE",
    }),

  // Ativar/Desativar flow
  toggleActive: (id: string): Promise<Types.FlowResponse> =>
    apiRequest<Types.FlowResponse>(`/flows/${id}/toggle`, {
      method: "PATCH",
    }),

  // Executar flow manualmente
  execute: (
    id: string,
    sessionId: string,
    contact: string
  ): Promise<Types.FlowExecutionResult> =>
    apiRequest<Types.FlowExecutionResult>(`/flows/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({ sessionId, contact }),
    }),
};

// ============================================================================
// 👥 CONTACTS API
// ============================================================================

export const contactsApi = {
  // Listar todos os contatos
  getAll: (
    filters?: Types.ContactFilters
  ): Promise<Types.ContactsListResponse> =>
    apiRequest<Types.ContactsListResponse>("/contacts", {
      method: "POST",
      body: JSON.stringify(filters || {}),
    }),

  // Obter contato específico
  getById: (id: string): Promise<Types.ContactResponse> =>
    apiRequest<Types.ContactResponse>(`/contacts/${id}`),

  // Criar novo contato
  create: (data: Types.CreateContactRequest): Promise<Types.ContactResponse> =>
    apiRequest<Types.ContactResponse>("/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar contato
  update: (
    id: string,
    data: Types.UpdateContactRequest
  ): Promise<Types.ContactResponse> =>
    apiRequest<Types.ContactResponse>(`/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Deletar contato
  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/contacts/${id}`, {
      method: "DELETE",
    }),

  // Bloquear/Desbloquear contato
  toggleBlock: (id: string): Promise<Types.ContactResponse> =>
    apiRequest<Types.ContactResponse>(`/contacts/${id}/block`, {
      method: "PATCH",
    }),

  // Buscar contatos
  search: (query: string): Promise<Types.SearchResponse<Types.Contact>> =>
    apiRequest<Types.SearchResponse<Types.Contact>>("/contacts/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),
};

// ============================================================================
// � IGNORED CONTACTS API
// ============================================================================

export const ignoredContactsApi = {
  // Listar contatos ignorados
  getAll: (
    filters?: Types.IgnoredContactFilters
  ): Promise<Types.IgnoredContactsListResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.isGlobal !== undefined)
      params.append("isGlobal", filters.isGlobal.toString());
    if (filters?.sessionId) params.append("sessionId", filters.sessionId);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const queryString = params.toString();
    return apiRequest<Types.IgnoredContactsListResponse>(
      `/ignored-contacts${queryString ? `?${queryString}` : ""}`
    );
  },

  // Obter contato ignorado por ID
  getById: (id: string): Promise<Types.IgnoredContact> =>
    apiRequest<Types.IgnoredContact>(`/ignored-contacts/${id}`),

  // Criar novo contato ignorado
  create: (
    data: Types.CreateIgnoredContactRequest
  ): Promise<Types.IgnoredContact> =>
    apiRequest<Types.IgnoredContact>("/ignored-contacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar contato ignorado
  update: (
    id: string,
    data: Types.UpdateIgnoredContactRequest
  ): Promise<Types.IgnoredContact> =>
    apiRequest<Types.IgnoredContact>(`/ignored-contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Deletar contato ignorado
  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/ignored-contacts/${id}`, {
      method: "DELETE",
    }),

  // Obter estatísticas de contatos ignorados
  getStats: (): Promise<Types.IgnoredContactsStats> =>
    apiRequest<Types.IgnoredContactsStats>("/ignored-contacts/stats"),

  // Verificar se um número está ignorado
  checkIgnored: (
    phoneNumber: string,
    sessionId?: string
  ): Promise<{ isIgnored: boolean; contact?: Types.IgnoredContact }> => {
    const params = new URLSearchParams();
    params.append("phoneNumber", phoneNumber);
    if (sessionId) params.append("sessionId", sessionId);

    return apiRequest<{ isIgnored: boolean; contact?: Types.IgnoredContact }>(
      `/ignored-contacts/check?${params.toString()}`
    );
  },
};

// ============================================================================
// �📊 DASHBOARD API
// ============================================================================

export const dashboardApi = {
  // Obter estatísticas
  getStats: (): Promise<Types.DashboardStats> =>
    apiRequest<Types.DashboardStats>("/dashboard/stats"),

  // Obter atividades recentes
  getActivities: (): Promise<Types.Activity[]> =>
    apiRequest<Types.Activity[]>("/dashboard/activities"),

  // Obter status do sistema
  getSystemStatus: (): Promise<Types.SystemStatus> =>
    apiRequest<Types.SystemStatus>("/dashboard/system-status"),

  // Obter dashboard completo
  getDashboard: (): Promise<Types.DashboardResponse> =>
    apiRequest<Types.DashboardResponse>("/dashboard"),
};

// ============================================================================
// 👥 USERS API
// ============================================================================

export const usersApi = {
  // Obter perfil do usuário autenticado
  getMyProfile: (): Promise<Types.GetProfileResponse> =>
    apiRequest<Types.GetProfileResponse>("/users/me"),

  // Atualizar perfil do usuário autenticado
  updateMyProfile: (
    data: Types.UpdateProfileRequest
  ): Promise<Types.UpdateProfileResponse> =>
    apiRequest<Types.UpdateProfileResponse>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
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
  ignoredContacts: ignoredContactsApi,
  dashboard: dashboardApi,
  users: usersApi,
};
