"use client";

import { socketService } from "@/services/socket";
import { useRealtimeStore } from "@/store/realtime";
import { useSessionsStore } from "@/store/sessions";
import { useSelectedTicket, useTickets } from "@/store/tickets";
import { useEffect, useRef } from "react";

/**
 * Hook unificado e simplificado para gerenciar tempo real
 * Substitui useRealtimeSystem, useSocketStore e parte da lógica duplicada
 */
export function useRealtime() {
  const {
    sessions,
    isLoading: sessionsLoading,
    loadSessions,
    updateSessionStatus: updateSessionInStore,
    setSessionQrCode: setQrInStore,
  } = useSessionsStore();

  const {
    isConnected,
    error,
    initialize,
    cleanup,
    joinSession,
    joinTicket,
    leaveTicket,
    updateSessionStatus,
    setSessionQrCode,
    getMessagesForContext,
  } = useRealtimeStore();

  const { updateTicketInList, addMessageToTicket } = useTickets();
  const { selectedTicket, addMessage: addMessageToChat } = useSelectedTicket();

  const initialized = useRef(false);

  // Configurar callbacks para integração com outros stores
  useEffect(() => {
    const store = useRealtimeStore.getState();

    // Callback para novas mensagens
    store.onNewMessage = (message) => {
      console.log("📨 Nova mensagem recebida via realtime:", message);

      // Verificar se tem ticketId
      if (message.ticketId) {
        try {
          // Criar objeto da mensagem compatível com TicketMessage
          const messageData = {
            id: message.id,
            ticketId: message.ticketId,
            contactId: message.contactId || "",
            content: message.content || "",
            messageType: message.messageType,
            direction: message.direction,
            status: message.status,
            isFromBot: message.isFromBot,
            botFlowId: message.botFlowId,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          };

          console.log(
            "📨 Processando mensagem para ticket:",
            message.ticketId,
            messageData
          );

          // Atualizar ticket na lista
          addMessageToTicket(message.ticketId, messageData);

          // Se é o ticket selecionado, adicionar ao chat
          if (selectedTicket?.id === message.ticketId) {
            console.log(
              "💬 Adicionando mensagem ao chat do ticket selecionado"
            );
            addMessageToChat(messageData);
          }
        } catch (error) {
          console.error("❌ Erro ao processar mensagem:", error, message);
        }
      } else {
        console.warn("⚠️ Mensagem recebida sem ticketId:", {
          messageId: message.id,
          contactId: message.contactId,
          sessionId: message.sessionId,
          content: message.content,
          from: message.from,
          timestamp: message.timestamp,
        });

        // TODO: Implementar fallback por contactId se necessário
        // Buscar ticket ativo para o contactId e associar a mensagem

        // Log para debug - mostrar todos os campos disponíveis
        console.log("🔍 Campos disponíveis na mensagem:", Object.keys(message));
      }
    };

    // Callback para mudanças de status de sessão
    store.onSessionStatusChange = (sessionId, status) => {
      updateSessionInStore(sessionId, status.status, status.error);
      if (status.qrCode) {
        setQrInStore(sessionId, status.qrCode, status.qrCodeTimestamp);
      }
    };

    // Callback para atualizações de ticket
    store.onTicketUpdate = (ticketId, updates) => {
      updateTicketInList(ticketId, updates);
    };
  }, [selectedTicket?.id]);

  // Inicialização única
  useEffect(() => {
    if (initialized.current) return;

    const initSystem = async () => {
      try {
        console.log("🚀 Inicializando sistema unificado...");
        console.log("🔍 Socket estado antes da inicialização:", {
          socketExists: !!socketService.getSocket(),
          socketConnected: socketService.isConnected(),
        });

        // 1. Carregar sessões
        await loadSessions();

        // 2. Aguardar socket estar disponível e conectado
        const waitForSocket = () => {
          return new Promise<void>((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos

            const check = () => {
              const socket = socketService.getSocket();
              const isConnected = socketService.isConnected();

              console.log(
                `🔍 Aguardando socket tentativa ${
                  attempts + 1
                }/${maxAttempts}, socket: ${!!socket}, connected: ${isConnected}`
              );

              if (socket && isConnected) {
                resolve();
              } else if (attempts >= maxAttempts) {
                console.warn("⚠️ Timeout aguardando socket, continuando...");
                resolve();
              } else {
                attempts++;
                setTimeout(check, 100);
              }
            };
            check();
          });
        };

        await waitForSocket();

        // 3. Inicializar realtime (vai sincronizar com o estado atual do socket)
        initialize();

        // 4. Verificar estado após inicialização
        console.log("🔍 Socket estado após inicialização:", {
          socketExists: !!socketService.getSocket(),
          socketConnected: socketService.isConnected(),
          realtimeConnected: useRealtimeStore.getState().isConnected,
        });

        // 4. Conectar a todas as sessões
        const currentSessions = useSessionsStore.getState().sessions;
        currentSessions.forEach((session) => {
          joinSession(session.id);
        });

        initialized.current = true;
        console.log("✅ Sistema unificado pronto");
      } catch (error) {
        console.error("❌ Erro na inicialização:", error);
      }
    };

    initSystem();

    return () => {
      cleanup();
      initialized.current = false;
    };
  }, []);

  // Sincronização periódica do estado de conexão
  useEffect(() => {
    if (!initialized.current) return;

    const syncConnectionState = () => {
      const socketConnected = socketService.isConnected();
      const realtimeConnected = useRealtimeStore.getState().isConnected;

      if (socketConnected !== realtimeConnected) {
        console.log(
          `🔄 Sincronizando estado de conexão: socket=${socketConnected}, realtime=${realtimeConnected} -> ${socketConnected}`
        );
        const store = useRealtimeStore.getState();
        store.setConnected(socketConnected);
      }
    };

    // Sincronizar imediatamente
    syncConnectionState();

    // Sincronizar a cada 2 segundos
    const interval = setInterval(syncConnectionState, 2000);

    return () => clearInterval(interval);
  }, [initialized.current]);

  // Conectar a novas sessões quando a lista mudar
  useEffect(() => {
    if (!initialized.current || !isConnected) return;

    sessions.forEach((session) => {
      joinSession(session.id);
    });
  }, [sessions.length, isConnected]);

  // Conectar/desconectar do ticket selecionado
  useEffect(() => {
    if (!selectedTicket) return;

    joinTicket(selectedTicket.id);

    return () => {
      leaveTicket(selectedTicket.id);
    };
  }, [selectedTicket?.id]);

  return {
    // Estados principais
    isConnected,
    error,
    isLoading: sessionsLoading,

    // Estatísticas
    totalSessions: sessions.length,
    connectedSessions: sessions.filter((s) => s.status === "connected").length,

    // Funções utilitárias
    getMessagesForSession: (sessionId: string) =>
      getMessagesForContext(sessionId),
    getMessagesForTicket: (ticketId: string) => getMessagesForContext(ticketId),

    // Status da inicialização
    isInitialized: initialized.current,
  };
}
