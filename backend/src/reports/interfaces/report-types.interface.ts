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
    type: 'sent' | 'received';
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
    status: 'active' | 'inactive' | 'blocked';
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
    ticketsHandled: number;
    averageResponseTime: string;
    resolutionRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    messagesHandled: number;
    ticketsResolved: number;
    averageResponseTime: string;
  }>;
}
