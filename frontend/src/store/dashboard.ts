import { dashboardApi } from "@/services/api";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Activity {
  id: string;
  action: string;
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
}

export interface Stats {
  sessions: number;
  messages: number;
  contacts: number;
  automations: number;
  // Dados reais do backend
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
}

export interface SystemStatus {
  isOnline: boolean;
  uptime: string;
  latency: string;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  ticketsResolved: number;
  averageResolutionTime: string;
  responseTime: string;
}

export interface ChartData {
  day: string;
  value: number;
  messages?: number;
}

interface DashboardState {
  // Estado
  stats: Stats;
  activities: Activity[];
  systemStatus: SystemStatus;
  chartData: ChartData[];
  agentPerformance: AgentPerformance[];
  isLoading: boolean;

  // Ações
  updateStats: (stats: Partial<Stats>) => void;
  addActivity: (activity: Omit<Activity, "id">) => void;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;
  updateAgentPerformance: (agents: AgentPerformance[]) => void;
  setLoading: (loading: boolean) => void;
  refreshDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      stats: {
        sessions: 0,
        messages: 0,
        contacts: 0,
        automations: 0,
        messagesInfo: {
          today: 0,
          yesterday: 0,
          percentageChange: 0,
        },
        contactsInfo: {
          total: 0,
          thisMonth: 0,
          percentageChange: 0,
        },
        ticketsInfo: {
          todayOpened: 0,
          todayClosed: 0,
          inProgress: 0,
          resolutionRate: 0,
          percentageChange: 0,
        },
      },
      activities: [
        {
          id: "1",
          action: "Nova sessão criada",
          time: "2 min atrás",
          type: "success",
          icon: "plus",
        },
        {
          id: "2",
          action: "Mensagem automática enviada",
          time: "5 min atrás",
          type: "info",
          icon: "message",
        },
        {
          id: "3",
          action: "Contato adicionado",
          time: "12 min atrás",
          type: "success",
          icon: "user",
        },
        {
          id: "4",
          action: "Sessão desconectada",
          time: "1h atrás",
          type: "warning",
          icon: "disconnect",
        },
      ],
      systemStatus: {
        isOnline: true,
        uptime: "99.9%",
        latency: "12ms",
      },
      chartData: [
        { day: "Dom", value: 20 },
        { day: "Seg", value: 35 },
        { day: "Ter", value: 45 },
        { day: "Qua", value: 25 },
        { day: "Qui", value: 60 },
        { day: "Sex", value: 55 },
        { day: "Sáb", value: 70 },
      ],
      agentPerformance: [],
      isLoading: false,

      // Ações
      updateStats: (newStats) =>
        set(
          (state) => ({
            stats: { ...state.stats, ...newStats },
          }),
          false,
          "updateStats"
        ),

      addActivity: (activity) =>
        set(
          (state) => ({
            activities: [
              {
                ...activity,
                id: Date.now().toString(),
              },
              ...state.activities.slice(0, 9), // Manter apenas os 10 mais recentes
            ],
          }),
          false,
          "addActivity"
        ),

      updateSystemStatus: (status) =>
        set(
          (state) => ({
            systemStatus: { ...state.systemStatus, ...status },
          }),
          false,
          "updateSystemStatus"
        ),

      updateAgentPerformance: (agents) =>
        set({ agentPerformance: agents }, false, "updateAgentPerformance"),

      setLoading: (loading) => set({ isLoading: loading }, false, "setLoading"),
      refreshDashboard: async () => {
        const { setLoading, addActivity } = get();

        setLoading(true);

        try {
          // Buscar dados reais do backend
          const [dashboardData, agentPerformanceData] = await Promise.all([
            dashboardApi.getDashboard(),
            dashboardApi.getAgentPerformance(),
          ]);

          // Buscar stats detalhadas para ter informações completas
          const statsData = await dashboardApi.getStats();

          // Mapear dados reais do backend
          const convertedStats: Stats = {
            sessions: dashboardData.stats.sessions,
            messages: dashboardData.stats.messages,
            contacts: dashboardData.stats.contacts,
            automations: dashboardData.stats.automations,
            messagesInfo: statsData.messagesInfo,
            contactsInfo: statsData.contactsInfo,
            ticketsInfo: statsData.ticketsInfo,
          };

          const convertedActivities: Activity[] = dashboardData.activities.map(
            (activity: any) => ({
              id: activity.id,
              action: activity.action,
              time: activity.time,
              type: activity.type,
              icon: activity.icon as Activity["icon"],
            })
          );

          const convertedSystemStatus: SystemStatus =
            dashboardData.systemStatus;

          // Mapear performance dos agentes com dados reais
          const convertedAgentPerformance: AgentPerformance[] =
            agentPerformanceData.map((agent: any) => ({
              agentId: agent.agentId,
              agentName: agent.agentName,
              ticketsResolved: agent.ticketsResolved,
              averageResolutionTime: agent.averageResolutionTime,
              responseTime: agent.responseTime,
            }));

          // Atualizar estado com dados reais
          set({
            stats: convertedStats,
            activities: convertedActivities,
            systemStatus: convertedSystemStatus,
            agentPerformance: convertedAgentPerformance,
            chartData: dashboardData.chartData || get().chartData,
          });

          // Adicionar atividade de atualização
          addActivity({
            action: "Dashboard atualizado com dados reais",
            time: "agora",
            type: "success",
            icon: "settings",
          });
        } catch (error) {
          console.error("Erro ao atualizar dashboard:", error);

          addActivity({
            action: "Erro ao conectar com API",
            time: "agora",
            type: "error",
            icon: "disconnect",
          });
        } finally {
          setLoading(false);
        }
      },
    }),
    {
      name: "dashboard-store",
    }
  )
);
