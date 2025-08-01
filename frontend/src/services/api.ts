// Configuração base da API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// Configuração padrão para requests
const defaultHeaders = {
  "Content-Type": "application/json",
};

// Importar todos os types
import {
  CreateGlobalUserResponse,
  CreateUserDto,
  GetAllUsersResponse,
} from "@/shared/interfaces/admin.interface";
import * as Types from "@/types";
import { UserManagementResults } from "@/types/admin";
import { toast } from "react-toastify";

// Função para logout forçado quando token expira
const handleTokenExpired = () => {
  if (typeof window !== "undefined") {
    // Mostrar notificação
    toast.error("Sessão expirada. Redirecionando para login...");

    // Limpar localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth-storage");

    // Disparar evento customizado para componentes que escutam
    window.dispatchEvent(new CustomEvent("authTokenExpired"));

    // Fallback: usar window.location após um pequeno delay
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  }
};

// Função helper para fazer requests
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Pegar token do localStorage se existir
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  // Pegar empresa atual do localStorage (se existir)
  let currentCompanyId = null;
  if (typeof window !== "undefined") {
    try {
      const authState = JSON.parse(
        localStorage.getItem("auth-storage") || "{}"
      );
      currentCompanyId = authState?.state?.currentCompanyId;
    } catch (error) {
      console.warn("Erro ao recuperar empresa atual do localStorage:", error);
    }
  }

  const config: RequestInit = {
    headers: {
      // Só incluir Content-Type se não for FormData
      ...(!(options.body instanceof FormData) && defaultHeaders),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(currentCompanyId && { "X-Company-Id": currentCompanyId }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // 🔒 INTERCEPTOR: Detectar token expirado
    if (response.status === 401) {
      console.warn("🔒 Token expirado detectado, redirecionando para login...");
      handleTokenExpired();
      throw new Error("Token expirado. Redirecionando para login...");
    }

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
    apiRequest<Types.ContactsListResponse>("/contact", {
      method: "GET",
    }),

  // Obter contato específico
  getById: (id: string): Promise<Types.ContactResponse> =>
    apiRequest<Types.ContactResponse>(`/contact/${id}`),

  // Criar novo contato
  create: (data: Types.CreateContactRequest): Promise<Types.ContactResponse> =>
    apiRequest<Types.ContactResponse>("/contact", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar contato
  update: (
    id: string,
    data: Types.UpdateContactRequest
  ): Promise<Types.ContactResponse> =>
    apiRequest<Types.ContactResponse>(`/contact/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Deletar contato
  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/contact/${id}`, {
      method: "DELETE",
    }),

  // Bloquear contato
  block: (id: string): Promise<Types.ContactResponse> =>
    apiRequest<Types.ContactResponse>(`/contact/${id}/block`, {
      method: "PATCH",
    }),

  // Desbloquear contato
  unblock: (id: string): Promise<Types.ContactResponse> =>
    apiRequest<Types.ContactResponse>(`/contact/${id}/unblock`, {
      method: "PATCH",
    }),

  // Buscar contatos
  search: (query: string): Promise<Types.SearchResponse<Types.Contact>> =>
    apiRequest<Types.SearchResponse<Types.Contact>>("/contact/search", {
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

  // Obter dados do gráfico
  getChartData: (): Promise<Types.ChartData[]> =>
    apiRequest("/dashboard/chart-data"),

  // Obter performance dos agentes
  getAgentPerformance: (): Promise<Types.AgentPerformance[]> =>
    apiRequest("/dashboard/agent-performance"),
};

// ============================================================================
// 🏢 COMPANY API
// ============================================================================

export const companyApi = {
  // Obter informações da empresa atual do usuário
  getMyCompany: (companyId: string): Promise<Types.GetCompanyResponse> =>
    apiRequest<Types.GetCompanyResponse>(`/company/${companyId}`),

  // Atualizar empresa
  updateCompany: (
    companyId: string,
    data: Types.UpdateCompanyRequest
  ): Promise<Types.UpdateCompanyResponse> =>
    apiRequest<Types.UpdateCompanyResponse>(`/company/${companyId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Obter usuários da empresa (para COMPANY_ADMIN/OWNER)
  getCompanyUsers: (
    companyId: string
  ): Promise<Types.GetCompanyUsersResponse> =>
    apiRequest<Types.GetCompanyUsersResponse>(
      `/admin/companies/${companyId}/users`
    ),

  // Criar usuário na empresa
  createCompanyUser: (
    companyId: string,
    data: Types.CreateCompanyUserRequest
  ): Promise<Types.CreateCompanyUserResponse> =>
    apiRequest<Types.CreateCompanyUserResponse>(
      `/admin/companies/${companyId}/users`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  // Atualizar usuário da empresa
  updateCompanyUser: (
    companyId: string,
    userId: string,
    data: Types.UpdateCompanyUserRequest
  ): Promise<Types.UpdateCompanyUserResponse> =>
    apiRequest<Types.UpdateCompanyUserResponse>(
      `/admin/companies/${companyId}/users/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),

  // Remover usuário da empresa
  removeCompanyUser: (
    companyId: string,
    userId: string
  ): Promise<Types.RemoveUserResponse> =>
    apiRequest<Types.RemoveUserResponse>(
      `/admin/companies/${companyId}/users/${userId}`,
      {
        method: "DELETE",
      }
    ),

  // Adicionar usuário existente à empresa
  addUserToCompany: (
    companyId: string,
    data: Types.AddUserToCompanyRequest
  ): Promise<Types.AddUserResponse> =>
    apiRequest<Types.AddUserResponse>(`/company/${companyId}/users`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Obter empresas do usuário atual
  getMyCompanies: (): Promise<Types.GetUserCompaniesResponse> =>
    apiRequest<Types.GetUserCompaniesResponse>("/company/my/companies"),
};

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

// ================================
// APIs de Gestão Global de Usuários (ADMIN)
// ================================

export const adminUsersApi = {
  // Listar todos os usuários do sistema
  getAllUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<GetAllUsersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    return apiRequest<GetAllUsersResponse>(
      `/admin/users${queryString ? "?" + queryString : ""}`
    );
  },

  // Criar usuário global
  createGlobalUser: (data: CreateUserDto): Promise<CreateGlobalUserResponse> =>
    apiRequest<CreateGlobalUserResponse>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar usuário global
  updateGlobalUser: (
    userId: string,
    data: {
      name?: string;
      isActive?: boolean;
      password?: string;
    }
  ): Promise<{
    user: {
      id: string;
      email: string;
      name: string;
      isActive: boolean;
      isFirstLogin: boolean;
      createdAt: string;
      updatedAt: string;
    };
    message: string;
  }> =>
    apiRequest<{
      user: {
        id: string;
        email: string;
        name: string;
        isActive: boolean;
        isFirstLogin: boolean;
        createdAt: string;
        updatedAt: string;
      };
      message: string;
    }>(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Remover usuário do sistema
  deleteGlobalUser: (userId: string): Promise<{ message: string }> =>
    apiRequest<{ message: string }>(`/admin/users/${userId}`, {
      method: "DELETE",
    }),

  // Gerenciar empresas de um usuário
  manageUserCompanies: (
    userId: string,
    data: {
      addCompanies?: Array<{ companyId: string; roleId: string }>;
      removeCompanies?: string[];
      updateRoles?: Array<{ companyId: string; roleId: string }>;
    }
  ): Promise<{
    results: UserManagementResults;
    message: string;
  }> =>
    apiRequest<{
      results: UserManagementResults;
      message: string;
    }>(`/admin/users/${userId}/companies`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ================================
// APIs de Administração de Empresas (SUPER_ADMIN)
// ================================

export const adminCompaniesApi = {
  // Listar todas as empresas do sistema (SUPER_ADMIN)
  getAllCompanies: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
  }): Promise<{
    companies: Array<{
      id: string;
      name: string;
      slug: string;
      plan: string;
      isActive: boolean;
      createdAt: string;
      _count: {
        users: number;
        tickets: number;
        sessions: number;
      };
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.plan) queryParams.append("plan", params.plan);

    const queryString = queryParams.toString();
    return apiRequest(
      `/admin/companies${queryString ? "?" + queryString : ""}`
    );
  },

  // Obter detalhes de uma empresa específica
  getCompanyDetails: (
    companyId: string
  ): Promise<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
    users: Array<{
      id: string;
      email: string;
      name: string;
      role: { id: string; name: string };
    }>;
    stats: {
      totalTickets: number;
      activeSessions: number;
      totalUsers: number;
    };
    createdAt: string;
  }> => apiRequest(`/admin/companies/${companyId}`),

  // Criar empresa (SUPER_ADMIN)
  createCompany: (data: {
    name: string;
    slug: string;
    plan: string;
  }): Promise<{
    company: {
      id: string;
      name: string;
      slug: string;
      plan: string;
    };
    message: string;
  }> =>
    apiRequest("/admin/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Criar empresa com proprietário (SUPER_ADMIN)
  createCompanyWithOwner: (data: {
    companyName: string;
    companySlug: string;
    plan: string;
    userName: string;
    userEmail: string;
    userPassword: string;
  }): Promise<{
    company: {
      id: string;
      name: string;
      slug: string;
      plan: string;
    };
    user: {
      id: string;
      email: string;
      name: string;
    };
    message: string;
  }> =>
    apiRequest("/admin/companies/with-owner", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar empresa (SUPER_ADMIN)
  updateCompany: (
    companyId: string,
    data: {
      name?: string;
      slug?: string;
      plan?: string;
    }
  ): Promise<{
    company: {
      id: string;
      name: string;
      slug: string;
      plan: string;
      isActive: boolean;
      updatedAt: string;
    };
    message: string;
  }> =>
    apiRequest(`/admin/companies/${companyId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Ativar/Desativar empresa (SUPER_ADMIN)
  toggleCompanyStatus: (
    companyId: string
  ): Promise<{
    company: {
      id: string;
      name: string;
      isActive: boolean;
    };
    message: string;
  }> =>
    apiRequest(`/admin/companies/${companyId}/toggle-status`, {
      method: "PATCH",
    }),

  // Excluir empresa (SUPER_ADMIN)
  deleteCompany: (
    companyId: string
  ): Promise<{
    message: string;
  }> =>
    apiRequest(`/admin/companies/${companyId}`, {
      method: "DELETE",
    }),

  // Obter estatísticas do dashboard (SUPER_ADMIN)
  getSystemDashboard: (): Promise<{
    companies: {
      total: number;
      active: number;
      byPlan: {
        FREE: number;
        BASIC: number;
        PRO: number;
        ENTERPRISE: number;
      };
    };
    users: {
      total: number;
      active: number;
      newThisMonth: number;
    };
    tickets: {
      total: number;
      openToday: number;
      resolvedToday: number;
    };
    sessions: {
      total: number;
      connected: number;
      disconnected: number;
    };
  }> => apiRequest("/admin/dashboard"),
};

// 🎭 ROLES API
// ============================================================================

export const rolesApi = {
  // Listar todas as roles disponíveis
  getRoles: (): Promise<
    Array<{ id: string; name: string; description?: string }>
  > =>
    apiRequest<Array<{ id: string; name: string; description?: string }>>(
      "/roles"
    ),
};

// 🎫 TICKETS API
// ============================================================================

export const ticketsApi = {
  // Listar tickets com paginação e filtros
  getAll: (
    status?: string,
    assignedAgentId?: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{
    tickets: Array<{
      id: string;
      status:
        | "OPEN"
        | "IN_PROGRESS"
        | "WAITING_CUSTOMER"
        | "RESOLVED"
        | "CLOSED";
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      title?: string;
      description?: string;
      contact: {
        id: string;
        name: string;
        phoneNumber: string;
      };
      messagingSession: {
        id: string;
        name: string;
      };
      assignedAgent?: {
        id: string;
        name: string;
        email: string;
      };
      createdAt: string;
      updatedAt: string;
      lastMessageAt?: string;
      resolvedAt?: string;
      closedAt?: string;
      _count?: {
        messages: number;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (assignedAgentId) params.append("assignedAgentId", assignedAgentId);
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (search) params.append("search", search);
    return apiRequest(`/tickets?${params.toString()}`);
  },

  // Buscar ticket por ID
  getById: (
    id: string
  ): Promise<{
    id: string;
    status: string;
    priority: string;
    title?: string;
    description?: string;
    contact: any;
    messagingSession: any;
    assignedAgent?: any;
    messages: Array<{
      id: string;
      content: string;
      direction: "INBOUND" | "OUTBOUND";
      messageType: string;
      isFromBot: boolean;
      createdAt: string;
      contact?: {
        name: string;
        phoneNumber: string;
      };
    }>;
    history: any[];
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string;
    resolvedAt?: string;
    closedAt?: string;
  }> => apiRequest(`/tickets/${id}`),

  // Criar novo ticket
  create: (data: {
    messagingSessionId: string;
    contactId: string;
    title?: string;
    description?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category?: string;
    assignedAgentId?: string;
  }): Promise<any> =>
    apiRequest("/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Atualizar ticket
  update: (
    id: string,
    data: {
      title?: string;
      description?: string;
      status?:
        | "OPEN"
        | "IN_PROGRESS"
        | "WAITING_CUSTOMER"
        | "RESOLVED"
        | "CLOSED";
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      category?: string;
      assignedAgentId?: string;
    }
  ): Promise<any> =>
    apiRequest(`/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Fechar ticket
  close: (id: string, comment?: string): Promise<{ message: string }> =>
    apiRequest(`/tickets/${id}/close`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  // Reabrir ticket
  reopen: (id: string, comment?: string): Promise<{ message: string }> =>
    apiRequest(`/tickets/${id}/reopen`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  // Atribuir ticket
  assign: (id: string, agentId: string): Promise<any> =>
    apiRequest(`/tickets/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ agentId }),
    }),

  // Buscar mensagens do ticket
  getMessages: (
    id: string
  ): Promise<
    Array<{
      id: string;
      content: string;
      direction: "INBOUND" | "OUTBOUND";
      messageType: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
      status: "SENT" | "DELIVERED" | "READ" | "FAILED";
      isFromBot: boolean;
      createdAt: string;
      updatedAt: string;
      contact?: {
        name: string;
        phoneNumber: string;
      };
    }>
  > => apiRequest(`/tickets/${id}/messages`),

  // Enviar mensagem
  sendMessage: (
    id: string,
    data: {
      content: string;
      messageType?: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
    },
    file?: File
  ): Promise<{
    id: string;
    content: string;
    direction: "OUTBOUND";
    messageType: string;
    status: string;
    isFromBot: boolean;
    createdAt: string;
  }> => {
    if (file) {
      // Enviar com arquivo usando FormData
      const formData = new FormData();
      formData.append("content", data.content);
      if (data.messageType) {
        formData.append("messageType", data.messageType);
      }
      formData.append("file", file);

      return apiRequest(`/tickets/${id}/messages`, {
        method: "POST",
        body: formData,
        // Não definir headers para FormData (deixar o browser definir)
      });
    } else {
      // Enviar apenas texto
      return apiRequest(`/tickets/${id}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
  },

  // Estatísticas de tickets
  getStats: (): Promise<{
    total: number;
    open: number;
    inProgress: number;
    waitingCustomer: number;
    resolved: number;
    closed: number;
  }> => apiRequest("/tickets/stats"),

  // Meus tickets
  getMyTickets: (): Promise<any[]> => apiRequest("/tickets/my"),
};

// Interfaces para Business Hours
export interface BusinessHour {
  id?: string;
  companyId?: string;
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBusinessHourDto {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  timezone?: string;
}

export interface UpdateBusinessHourDto {
  isActive?: boolean;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
  timezone?: string;
}

export interface Holiday {
  id?: string;
  companyId?: string;
  name: string;
  date: string;
  type: "HOLIDAY" | "SPECIAL_HOURS" | "CLOSED";
  startTime?: string;
  endTime?: string;
  isRecurring: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHolidayDto {
  name: string;
  date: string;
  type: "HOLIDAY" | "SPECIAL_HOURS" | "CLOSED";
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  description?: string;
}

// Funções para Business Hours
export const businessHoursApi = {
  // Buscar horários de funcionamento
  getBusinessHours: async (): Promise<BusinessHour[]> => {
    return apiRequest<BusinessHour[]>("/business-hours");
  },

  // Criar horário para um dia específico
  createBusinessHour: async (
    data: CreateBusinessHourDto
  ): Promise<BusinessHour> => {
    return apiRequest<BusinessHour>("/business-hours", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Atualizar horário de um dia específico
  updateBusinessHour: async (
    dayOfWeek: number,
    data: UpdateBusinessHourDto
  ): Promise<BusinessHour> => {
    return apiRequest<BusinessHour>(`/business-hours/${dayOfWeek}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Deletar horário de um dia específico
  deleteBusinessHour: async (
    dayOfWeek: number
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/business-hours/${dayOfWeek}`, {
      method: "DELETE",
    });
  },

  // Atualizar múltiplos horários de uma vez (bulk update)
  updateMultipleBusinessHours: async (
    businessHours: BusinessHour[]
  ): Promise<BusinessHour[]> => {
    const promises = businessHours.map((hour) => {
      const { dayOfWeek, ...updateData } = hour;
      return businessHoursApi.updateBusinessHour(dayOfWeek, updateData);
    });
    return Promise.all(promises);
  },
};

// Funções para Feriados
export const holidaysApi = {
  // Buscar feriados
  getHolidays: async (): Promise<Holiday[]> => {
    return apiRequest<Holiday[]>("/business-hours/holidays");
  },

  // Criar feriado
  createHoliday: async (data: CreateHolidayDto): Promise<Holiday> => {
    return apiRequest<Holiday>("/business-hours/holidays", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Atualizar feriado
  updateHoliday: async (
    id: string,
    data: Partial<CreateHolidayDto>
  ): Promise<Holiday> => {
    return apiRequest<Holiday>(`/business-hours/holidays/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Deletar feriado
  deleteHoliday: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/business-hours/holidays/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// 📁 MEDIA API
// ============================================================================

export const mediaApi = {
  // Upload de arquivo
  upload: (file: File, metadata?: any): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }

    return apiRequest("/media/upload", {
      method: "POST",
      body: formData,
      // Não definir Content-Type, deixar o browser definir com boundary
      headers: {},
    });
  },

  // Visualizar arquivo
  view: (id: string): string => {
    return `${API_BASE_URL}/media/${id}`;
  },

  // Download de arquivo
  download: (id: string, filename?: string): Promise<Blob> => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const url = `${API_BASE_URL}/media/${id}/download${
      filename ? `?filename=${encodeURIComponent(filename)}` : ""
    }`;
    return fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao baixar arquivo");
      }
      return response.blob();
    });
  },

  // Deletar arquivo
  delete: (id: string): Promise<void> =>
    apiRequest(`/media/${id}`, {
      method: "DELETE",
    }),
};

// ============================================================================
// 📊 REPORTS API
// ============================================================================

// Interfaces para Reports
export interface ReportFilters {
  startDate: string;
  endDate: string;
  sessionId?: string;
  contactId?: string;
  agentId?: string;
}

export interface OverviewStats {
  totalMessages: number;
  totalContacts: number;
  activeSessions: number;
  responseTime: string;
  messagesByDay: Array<{
    date: string;
    messages: number;
  }>;
  topContacts: Array<{
    id: string;
    name: string;
    phone: string;
    messageCount: number;
    lastMessageAt: string;
  }>;
}

export interface MessageReport {
  messages: Array<{
    id: string;
    content: string;
    type: "sent" | "received";
    timestamp: string;
    contactName: string;
    contactPhone: string;
    sessionName: string;
    agentName?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface ContactReport {
  contacts: Array<{
    id: string;
    name: string;
    phone: string;
    messageCount: number;
    firstContactAt: string;
    lastMessageAt: string;
    status: "active" | "inactive" | "blocked";
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface PerformanceReport {
  totalTickets: number;
  resolvedTickets: number;
  resolutionRate: number;
  averageResponseTime: string;
  agentStats: Array<{
    agentId: string;
    agentName: string;
    handledTickets: number;
    averageResponseTime: number;
    activeTickets: number;
  }>;
  dailyStats: Array<{
    date: string;
    messagesHandled: number;
    ticketsResolved: number;
    averageResponseTime: string;
  }>;
}

// Helper para construir query string
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

export const reportsApi = {
  // Visão geral - estatísticas gerais
  getOverviewStats: (filters: ReportFilters): Promise<OverviewStats> => {
    const queryString = buildQueryString(filters);
    return apiRequest<OverviewStats>(`/reports/overview?${queryString}`);
  },

  // Relatório de mensagens
  getMessageReport: (
    filters: ReportFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<MessageReport> => {
    const queryString = buildQueryString({ ...filters, page, limit });
    return apiRequest<MessageReport>(`/reports/messages?${queryString}`);
  },

  // Relatório de contatos
  getContactReport: (
    filters: ReportFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<ContactReport> => {
    const queryString = buildQueryString({ ...filters, page, limit });
    return apiRequest<ContactReport>(`/reports/contacts?${queryString}`);
  },

  // Relatório de performance
  getPerformanceReport: (
    filters: ReportFilters
  ): Promise<PerformanceReport> => {
    const queryString = buildQueryString(filters);
    return apiRequest<PerformanceReport>(`/reports/performance?${queryString}`);
  },

  // Exportar relatório em PDF
  exportPDF: async (
    reportType: "overview" | "messages" | "contacts" | "performance",
    filters: ReportFilters
  ): Promise<Blob> => {
    const queryString = buildQueryString(filters);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    let currentCompanyId = null;
    if (typeof window !== "undefined") {
      try {
        const authState = JSON.parse(
          localStorage.getItem("auth-storage") || "{}"
        );
        currentCompanyId = authState?.state?.currentCompanyId;
      } catch (error) {
        console.warn("Erro ao recuperar empresa atual do localStorage:", error);
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/reports/${reportType}/export/pdf?${queryString}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(currentCompanyId && { "X-Company-Id": currentCompanyId }),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao exportar PDF");
    }

    return response.blob();
  },

  // Exportar relatório em Excel
  exportExcel: async (
    reportType: "overview" | "messages" | "contacts" | "performance",
    filters: ReportFilters
  ): Promise<Blob> => {
    const queryString = buildQueryString(filters);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    let currentCompanyId = null;
    if (typeof window !== "undefined") {
      try {
        const authState = JSON.parse(
          localStorage.getItem("auth-storage") || "{}"
        );
        currentCompanyId = authState?.state?.currentCompanyId;
      } catch (error) {
        console.warn("Erro ao recuperar empresa atual do localStorage:", error);
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/reports/${reportType}/export/excel?${queryString}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(currentCompanyId && { "X-Company-Id": currentCompanyId }),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao exportar Excel");
    }

    return response.blob();
  },
};

export default {
  auth: authApi,
  sessions: sessionsApi,
  messages: messagesApi,
  flows: flowsApi,
  contacts: contactsApi,
  ignoredContacts: ignoredContactsApi,
  dashboard: dashboardApi, // Usando a declaração exportada que já existe
  users: usersApi,
  company: companyApi,
  roles: rolesApi,
  adminUsers: adminUsersApi,
  adminCompanies: adminCompaniesApi,
  businessHours: businessHoursApi,
  holidays: holidaysApi,
  tickets: ticketsApi,
  media: mediaApi,
  reports: reportsApi,
};
