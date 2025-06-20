import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard";

export const useDashboard = () => {
  const {
    stats,
    activities,
    systemStatus,
    chartData,
    isLoading,
    updateStats,
    addActivity,
    updateSystemStatus,
    setLoading,
    refreshDashboard,
  } = useDashboardStore();

  // Atualização automática a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular atualizações em tempo real
      const randomUpdates = Math.random();

      if (randomUpdates > 0.7) {
        // 30% de chance de adicionar nova atividade
        const activities = [
          "Nova mensagem recebida",
          "Sessão reconectada",
          "Contato atualizado",
          "Automação executada",
        ];

        const types: Array<"success" | "info" | "warning"> = [
          "success",
          "info",
          "warning",
        ];
        const icons: Array<"message" | "plus" | "user" | "settings"> = [
          "message",
          "plus",
          "user",
          "settings",
        ];

        addActivity({
          action: activities[Math.floor(Math.random() * activities.length)],
          time: "agora",
          type: types[Math.floor(Math.random() * types.length)],
          icon: icons[Math.floor(Math.random() * icons.length)],
        });
      }

      if (randomUpdates > 0.9) {
        // 10% de chance de atualizar estatísticas
        updateStats({
          messages: stats.messages + Math.floor(Math.random() * 5),
        });
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [stats.messages, addActivity, updateStats]);

  return {
    stats,
    activities,
    systemStatus,
    chartData,
    isLoading,
    actions: {
      updateStats,
      addActivity,
      updateSystemStatus,
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
