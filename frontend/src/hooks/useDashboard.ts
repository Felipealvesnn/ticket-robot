import { useDashboardStore } from "@/store/dashboard";
import { useEffect } from "react";

export const useDashboard = () => {
  const {
    stats,
    activities,
    systemStatus,
    chartData,
    agentPerformance,
    isLoading,
    updateStats,
    addActivity,
    updateSystemStatus,
    updateAgentPerformance,
    setLoading,
    refreshDashboard,
  } = useDashboardStore();

  // Buscar dados reais na inicialização
  useEffect(() => {
    // Buscar dados do backend imediatamente
    refreshDashboard();
  }, [refreshDashboard]);

  // Atualização automática a cada 30 segundos com dados reais
  useEffect(() => {
    const interval = setInterval(() => {
      // Buscar dados reais do backend em vez de simular
      refreshDashboard();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [refreshDashboard]);

  return {
    stats,
    activities,
    systemStatus,
    chartData,
    agentPerformance,
    isLoading,
    actions: {
      updateStats,
      addActivity,
      updateSystemStatus,
      updateAgentPerformance,
      setLoading,
      refreshDashboard,
    },
  };
};

// Hook para ações rápidas
export const useQuickActions = () => {
  const { addActivity } = useDashboardStore();

  const createSession = () => {
    addActivity({
      action: "Nova sessão criada",
      time: "agora",
      type: "success",
      icon: "plus",
    });
    // Aqui você pode adicionar a lógica real para criar sessão
    console.log("Criando nova sessão...");
  };

  const sendMessage = () => {
    addActivity({
      action: "Mensagem enviada",
      time: "agora",
      type: "info",
      icon: "message",
    });
    // Aqui você pode adicionar a lógica real para enviar mensagem
    console.log("Enviando mensagem...");
  };

  const viewReports = () => {
    console.log("Abrindo relatórios...");
    // Aqui você pode adicionar navegação para relatórios
  };

  const openSettings = () => {
    console.log("Abrindo configurações...");
    // Aqui você pode adicionar navegação para configurações
  };

  return {
    createSession,
    sendMessage,
    viewReports,
    openSettings,
  };
};
