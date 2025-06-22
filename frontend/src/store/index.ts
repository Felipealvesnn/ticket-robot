// Re-exportações dos stores para facilitar importação
export { useDashboardStore } from "./dashboard";
export { useFlowsStore } from "./flows";
export { useSessionsStore } from "./sessions";

// Tipos compartilhados
export type { Activity, ChartData, Stats, SystemStatus } from "./dashboard";
export type { ChatFlow, FlowNode } from "./flows";
export type { Session } from "./sessions";

// Utilitários para resetar stores (útil para testes ou logout)
export const resetAllStores = () => {
  // Importar dinamicamente para evitar problemas de importação circular
  const { useDashboardStore } = require("./dashboard");
  const { useSessionsStore } = require("./sessions");

  // Reset dashboard
  useDashboardStore.setState({
    stats: {
      sessions: 0,
      messages: 0,
      contacts: 0,
      automations: 0,
    },
    activities: [],
    isLoading: false,
  });

  // Reset sessions
  useSessionsStore.setState({
    sessions: [],
    isLoading: false,
    error: null,
  });
};
