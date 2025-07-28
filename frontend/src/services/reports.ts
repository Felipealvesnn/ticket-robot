import { api } from "./api";

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

class ReportsService {
  // Visão geral - estatísticas gerais
  async getOverviewStats(filters: ReportFilters): Promise<OverviewStats> {
    const response = await api.get("/reports/overview", { params: filters });
    return response.data;
  }

  // Relatório de mensagens
  async getMessageReport(
    filters: ReportFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<MessageReport> {
    const response = await api.get("/reports/messages", {
      params: { ...filters, page, limit },
    });
    return response.data;
  }

  // Relatório de contatos
  async getContactReport(
    filters: ReportFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<ContactReport> {
    const response = await api.get("/reports/contacts", {
      params: { ...filters, page, limit },
    });
    return response.data;
  }

  // Relatório de performance
  async getPerformanceReport(
    filters: ReportFilters
  ): Promise<PerformanceReport> {
    const response = await api.get("/reports/performance", { params: filters });
    return response.data;
  }

  // Exportar relatório em PDF
  async exportPDF(
    reportType: "overview" | "messages" | "contacts" | "performance",
    filters: ReportFilters
  ): Promise<Blob> {
    const response = await api.get(`/reports/${reportType}/export/pdf`, {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  }

  // Exportar relatório em Excel
  async exportExcel(
    reportType: "overview" | "messages" | "contacts" | "performance",
    filters: ReportFilters
  ): Promise<Blob> {
    const response = await api.get(`/reports/${reportType}/export/excel`, {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  }
}

export const reportsService = new ReportsService();
