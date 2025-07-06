// Re-exportações dos stores para facilitar importação
export { useAuthStore } from "./auth";
export { useBusinessHoursStore } from "./business-hours";
export { useContactsStore } from "./contacts";
export { useDashboardStore } from "./dashboard";
export { useFlowsStore } from "./flows";
export { useMessagesStore } from "./messages";
export { useSessionsStore } from "./sessions";

// Tipos compartilhados dos DTOs centralizados
export * from "@/types";

// Utilitários para resetar stores (útil para testes ou logout)
export const resetAllStores = () => {
  // Importar dinamicamente para evitar problemas de importação circular
  const { useAuthStore } = require("./auth");
  const { useDashboardStore } = require("./dashboard");
  const { useSessionsStore } = require("./sessions");
  const { useMessagesStore } = require("./messages");
  const { useContactsStore } = require("./contacts");

  // Reset auth
  useAuthStore.getState().logout();

  // Reset dashboard
  useDashboardStore.setState({
    stats: null,
    activities: [],
    systemStatus: null,
    isLoading: false,
    error: null,
  });

  // Reset sessions
  useSessionsStore.setState({
    sessions: [],
    isLoading: false,
    error: null,
    currentQrCode: null,
  });

  // Reset messages
  useMessagesStore.setState({
    messages: [],
    isLoading: false,
    error: null,
    currentSessionId: null,
  });

  // Reset contacts
  useContactsStore.setState({
    contacts: [],
    isLoading: false,
    error: null,
    searchQuery: "",
    selectedTags: [],
  });
};
