// ============================================================================
// 📊 DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  sessions: {
    total: number;
    connected: number;
    disconnected: number;
    connecting: number;
  };
  messages: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    today: number;
  };
  contacts: {
    total: number;
    new: number;
    active: number;
    blocked: number;
  };
  automations: {
    total: number;
    active: number;
    inactive: number;
    executions: number;
  };
}

export interface Activity {
  id: string;
  action: string;
  description?: string;
  time: string;
  type: "success" | "info" | "warning" | "error";
  icon:
    | "plus"
    | "message"
    | "user"
    | "disconnect"
    | "settings"
    | "flow"
    | "contact";
  userId?: string;
  sessionId?: string;
  contactId?: string;
  flowId?: string;
}

export interface SystemStatus {
  isOnline: boolean;
  uptime: string;
  latency: string;
  version: string;
  environment: "development" | "staging" | "production";
  services: {
    database: "healthy" | "warning" | "error";
    whatsapp: "healthy" | "warning" | "error";
    redis: "healthy" | "warning" | "error";
  };
}

export interface ChartData {
  day: string;
  date: string;
  value: number;
  label?: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  activities: Activity[];
  systemStatus: SystemStatus;
  chartData: ChartData[];
}
