"use client";

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
      // Atualizar ticket se houver ticketId
      if (message.ticketId) {
        addMessageToTicket(message.ticketId, {
          id: message.id,
          ticketId: message.ticketId,
          contactId: message.contactId,
          content: message.content,
          messageType: message.messageType,
          direction: message.direction,
          status: message.status,
          isFromBot: message.isFromBot,
          botFlowId: message.botFlowId,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        });

        // Se é o ticket selecionado, adicionar ao chat
        if (selectedTicket?.id === message.ticketId) {
          addMessageToChat({
            id: message.id,
            ticketId: message.ticketId,
            contactId: message.contactId,
            content: message.content,
            messageType: message.messageType,
            direction: message.direction,
            status: message.status,
            isFromBot: message.isFromBot,
            botFlowId: message.botFlowId,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          });
        }
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
        
        // 1. Carregar sessões
        await loadSessions();
        
        // 2. Inicializar realtime
        initialize();
        
        // 3. Aguardar conexão
        const waitForConnection = () => {
          return new Promise<void>((resolve) => {
            const check = () => {
              if (useRealtimeStore.getState().isConnected) {
                resolve();
              } else {
                setTimeout(check, 100);
              }
            };
            check();
          });
        };

        await waitForConnection();

        // 4. Conectar a todas as sessões
        const currentSessions = useSessionsStore.getState().sessions;
        currentSessions.forEach(session => {
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

  // Conectar a novas sessões quando a lista mudar
  useEffect(() => {
    if (!initialized.current || !isConnected) return;
    
    sessions.forEach(session => {
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
    connectedSessions: sessions.filter(s => s.status === "connected").length,
    
    // Funções utilitárias
    getMessagesForSession: (sessionId: string) => getMessagesForContext(sessionId),
    getMessagesForTicket: (ticketId: string) => getMessagesForContext(ticketId),
    
    // Status da inicialização
    isInitialized: initialized.current,
  };
}
