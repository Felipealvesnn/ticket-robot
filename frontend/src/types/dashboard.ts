export interface DashboardStats {
  sessions: number;
  messagesInfo: {
    today: number;
    yesterday: number;
    percentageChange: number;
  };
  contactsInfo: {
    total: number;
    thisMonth: number;
    percentageChange: number;
  };
  ticketsInfo: {
    todayOpened: number;
    todayClosed: number;
    inProgress: number;
    resolutionRate: number;
    percentageChange: number;
  };
  automations: number;
}

export interface Activity {
  id: string;
  type: "success" | "info" | "warning" | "error";
  icon: "message" | "user" | "session" | "flow" | "ticket";
  action: string;
  time: string;
}

export interface ChartData {
  day: string;
  value: number;
  messages: number;
}

export interface SystemStatus {
  isOnline: boolean;
  uptime: string;
  latency: string;
  lastChecked: string;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  ticketsResolved: number;
  averageResolutionTime: string;
  responseTime: string;
}

export interface DashboardResponse {
  stats: {
    sessions: number;
    messages: number;
    contacts: number;
    automations: number;
  };
  activities: Activity[];
  systemStatus: SystemStatus;
  chartData: ChartData[];
}
