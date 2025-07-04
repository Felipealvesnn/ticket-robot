import { socketService } from "@/services/socket";
import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useEffect } from "react";

/**
 * Hook para gerenciar listeners específicos de sessões
 * Assume que o socket já foi inicializado pelo useSocketInitializer
 */
export function useSocketSessions() {
  const {
    sessions,
    joinAllSessions,
    setupSocketListeners,
    cleanupSocketListeners,
  } = useSessionsStore();
  const { isAuthenticated } = useAuthStore();

  // 🔥 EFEITO 1: Configurar listeners de sessões quando socket estiver conectado
  useEffect(() => {
    if (!isAuthenticated || !socketService.isConnected()) {
      return;
    }

    // Apenas configurar listeners específicos de sessões
    setupSocketListeners();
    console.log("✅ Listeners de sessões configurados");

    // Cleanup ao desmontar ou perder autenticação
    return () => {
      cleanupSocketListeners();
      console.log("🧹 Socket listeners de sessões removidos");
    };
  }, [isAuthenticated, setupSocketListeners, cleanupSocketListeners]);

  // 🔥 EFEITO 2: Auto-join baseado nas sessões atuais (apenas uma vez por mudança)
  useEffect(() => {
    if (
      !isAuthenticated ||
      !socketService.isConnected() ||
      sessions.length === 0
    ) {
      return;
    }

    // Aguardar um pouco para o socket estar completamente pronto
    const timeoutId = setTimeout(() => {
      joinAllSessions();
      console.log(`📱 Auto-join realizado em ${sessions.length} sessões`);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, sessions.length, joinAllSessions]); // Usar length em vez do array completo

  return {
    // Funções utilitárias
    joinAllSessions,
    isSocketConnected: socketService.isConnected(),
    sessionsCount: sessions.length,
  };
}
