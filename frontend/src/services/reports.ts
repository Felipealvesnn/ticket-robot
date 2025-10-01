// Importar a função apiRequest do arquivo api.ts existente
import { apiRequest } from "./api";

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
  averageResponseTime: number;
  messageVolumeByHour: Array<{
    hour: number;
    messageCount: number;
  }>;
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    handledTickets: number;
    averageResponseTime: number;
    activeTickets: number;
  }>;
  sessionStats: Array<{
    sessionId: string;
    sessionName: string;
    messageCount: number;
    contactCount: number;
    isActive: boolean;
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
  exportPDF: (
    reportType: "overview" | "messages" | "contacts" | "performance",
    filters: ReportFilters
  ): Promise<Blob> => {
    const queryString = buildQueryString(filters);
    return fetch(
      `${
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
      }/reports/${reportType}/export/pdf?${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : ""
          }`,
          "X-Company-Id":
            typeof window !== "undefined"
              ? JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state
                  ?.currentCompanyId
              : "",
        },
      }
    ).then((response) => {
      if (!response.ok) throw new Error("Erro ao exportar PDF");
      return response.blob();
    });
  },

  // Exportar relatório em Excel
  exportExcel: (
    reportType: "overview" | "messages" | "contacts" | "performance",
    filters: ReportFilters
  ): Promise<Blob> => {
    const queryString = buildQueryString(filters);
    return fetch(
      `${
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
      }/reports/${reportType}/export/excel?${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${
            typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
              : ""
          }`,
          "X-Company-Id":
            typeof window !== "undefined"
              ? JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state
                  ?.currentCompanyId
              : "",
        },
      }
    ).then((response) => {
      if (!response.ok) throw new Error("Erro ao exportar Excel");
      return response.blob();
    });
  },
};

// Para compatibilidade com o código existente
class ReportsService {
  async getOverviewStats(filters: ReportFilters): Promise<OverviewStats> {
    return reportsApi.getOverviewStats(filters);
  }

  async getMessageReport(
    filters: ReportFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<MessageReport> {
    return reportsApi.getMessageReport(filters, page, limit);
  }

  async getContactReport(
    filters: ReportFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<ContactReport> {
    return reportsApi.getContactReport(filters, page, limit);
  }

  async getPerformanceReport(
    filters: ReportFilters
  ): Promise<PerformanceReport> {
    return reportsApi.getPerformanceReport(filters);
  }

  async exportPDF(
    reportType: "overview" | "messages" | "contacts" | "performance",
    filters: ReportFilters
  ): Promise<Blob> {
    return reportsApi.exportPDF(reportType, filters);
  }

  async exportExcel(
    reportType: "overview" | "messages" | "contacts" | "performance",
    filters: ReportFilters
  ): Promise<Blob> {
    return reportsApi.exportExcel(reportType, filters);
  }
}

export const reportsService = new ReportsService();
