import { dashboardApi } from "@/services/api";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Activity {
  id: string;
  action: string;
  time: string;
  type: "success" | "info" | "warning" | "error";
  icon: "plus" | "message" | "user" | "disconnect" | "settings";
}

export interface Stats {
  sessions: number;
  messages: number;
  contacts: number;
  automations: number;
}

export interface SystemStatus {
  isOnline: boolean;
  uptime: string;
  latency: string;
}

export interface ChartData {
  day: string;
  value: number;
}

interface DashboardState {
  // Estado
  stats: Stats;
  activities: Activity[];
  systemStatus: SystemStatus;
  chartData: ChartData[];
  isLoading: boolean;

  // Ações
  updateStats: (stats: Partial<Stats>) => void;
  addActivity: (activity: Omit<Activity, "id">) => void;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;
  setLoading: (loading: boolean) => void;
  refreshDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      stats: {
        sessions: 3,
        messages: 127,
        contacts: 1234,
        automations: 8,
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

      setLoading: (loading) => set({ isLoading: loading }, false, "setLoading"),
      refreshDashboard: async () => {
        const { setLoading, updateStats, addActivity } = get();

        setLoading(true);

        try {
          // Buscar dados reais da API
          const [stats, activities, systemStatus] = await Promise.all([
            dashboardApi.getStats(),
            dashboardApi.getActivities(),
            dashboardApi.getSystemStatus(),
          ]);

          // Atualizar estado com dados da API
          set({
            stats,
            activities,
            systemStatus,
          });

          // Adicionar atividade de atualização
          addActivity({
            action: "Dashboard atualizado",
            time: "agora",
            type: "success",
            icon: "settings",
          });
        } catch (error) {
          console.error("Erro ao atualizar dashboard:", error);

          // Fallback: usar dados mock se API falhar
          updateStats({
            sessions: Math.floor(Math.random() * 10) + 1,
            messages: Math.floor(Math.random() * 200) + 50,
            contacts: Math.floor(Math.random() * 1000) + 500,
            automations: Math.floor(Math.random() * 15) + 5,
          });

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
