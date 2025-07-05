// Interfaces para dashboard administrativo

export interface SystemDashboard {
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
}

export interface CompanyDashboard {
  company: {
    id: string;
    name: string;
    plan: string;
  };
  users: {
    total: number;
  };
  tickets: {
    total: number;
    open: number;
    recentlyCreated: number;
    byStatus: Record<string, number>;
  };
  sessions: {
    total: number;
    active: number;
    inactive: number;
  };
  contacts: {
    total: number;
  };
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
