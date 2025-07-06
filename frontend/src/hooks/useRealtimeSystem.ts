"use client";

import { socketService } from "@/services/socket";
import { useSessionsStore } from "@/store/sessions";
import { useSocketStore } from "@/store/socket";
import { useEffect, useRef } from "react";

/**
 * Hook unificado para gerenciar sessões e sincronização de mensagens em tempo real
 */
export function useRealtimeSystem() {
  const {
    sessions,
    isLoading,
    loadSessions,
    joinAllSessions,
    setupSocketListeners,
    cleanupSocketListeners,
  } = useSessionsStore();

  const { initializeSocket, isConnected } = useSocketStore();

  // const { addMessageToTicket, updateTicketInList } = useTickets.getState();

  const initialized = useRef(false);

  // Inicialização do sistema
  useEffect(() => {
    if (initialized.current) return;

    console.log("🚀 Inicializando sistema unificado de tempo real...");

    // Carregamento sequencial para evitar race conditions
    const initializeSystem = async () => {
      try {
        // 1. Carregar sessões primeiro
        await loadSessions();

        // 2. Configurar listeners das sessões
        setupSocketListeners();

        // 3. Inicializar socket store para tickets e mensagens
        initializeSocket();

        // 4. Aguardar socket estar conectado
        const waitForSocket = () => {
          return new Promise<void>((resolve) => {
            const checkConnection = () => {
              if (socketService.isConnected()) {
                resolve();
              } else {
                setTimeout(checkConnection, 100);
              }
            };
            checkConnection();
          });
        };

        await waitForSocket();

        // 5. Fazer join em todas as sessões
        setTimeout(() => {
          joinAllSessions();
          initialized.current = true;
          console.log("✅ Sistema unificado inicializado com sucesso");
          console.log("📊 Status:", {
            sessionsCarregadas: sessions.length,
            socketConectado: isConnected,
            inicializado: true,
          });
        }, 200);
      } catch (error) {
        console.error("❌ Erro ao inicializar sistema unificado:", error);
      }
    };

    initializeSystem();

    // Cleanup
    return () => {
      cleanupSocketListeners();
      initialized.current = false;
      console.log("🧹 Sistema unificado finalizado");
    };
  }, []);

  // Reativar join quando sessões mudarem
  useEffect(() => {
    if (
      sessions.length > 0 &&
      socketService.isConnected() &&
      initialized.current
    ) {
      setTimeout(() => joinAllSessions(), 100);
    }
  }, [sessions.length, joinAllSessions]);

  // Estatísticas básicas
  const stats = {
    isInitialized: initialized.current,
    totalSessions: sessions.length,
    totalRealtimeMessages: 0, // Placeholder
    syncedMessages: 0, // Placeholder
    sessionsWithMessages: 0, // Placeholder
  };

  return {
    // Estados principais
    sessions,
    isLoading,

    // Estatísticas
    ...stats,

    // Para debug
    processedCount: 0,
  };
}
