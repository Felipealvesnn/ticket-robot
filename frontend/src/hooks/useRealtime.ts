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
    store.onNewMessage = async (message: any) => {
      console.log("📨 Nova mensagem recebida via realtime:", message);

      // ===== DEBUG COMPLETO DA ESTRUTURA =====
      console.log("🔍 ESTRUTURA COMPLETA DA MENSAGEM:");
      console.log("🔍 message:", JSON.stringify(message, null, 2));

      // Se a mensagem vem dentro de um objeto 'message'
      let actualMessage = message;
      if (message.message && typeof message.message === "object") {
        console.log("🔍 Mensagem aninhada detectada, usando message.message");
        actualMessage = message.message;
      }

      console.log(
        "🔍 CAMPOS DISPONÍVEIS na mensagem:",
        Object.keys(actualMessage)
      );
      console.log("🔍 from:", actualMessage.from);
      console.log("🔍 to:", actualMessage.to);
      console.log("🔍 isMe:", actualMessage.isMe);
      console.log("🔍 fromMe:", actualMessage.fromMe);
      console.log("🔍 direction:", actualMessage.direction);
      console.log("🔍 body:", actualMessage.body);
      console.log("🔍 content:", actualMessage.content);

      // CORREÇÃO: Lógica mais robusta para determinar a direção da mensagem
      let isOutbound = false;

      // 1. PRIORIDADE: Verificar isMe primeiro (campo adicionado no backend)
      if (actualMessage.isMe !== undefined) {
        isOutbound = actualMessage.isMe === true;
        console.log(
          "🎯 Direção determinada pelo campo 'isMe':",
          actualMessage.isMe,
          "-> isOutbound:",
          isOutbound
        );
      }
      // 2. Verificar fromMe (campo nativo do WhatsApp)
      else if (actualMessage.fromMe !== undefined) {
        isOutbound = actualMessage.fromMe === true;
        console.log(
          "🎯 Direção determinada pelo campo 'fromMe':",
          actualMessage.fromMe,
          "-> isOutbound:",
          isOutbound
        );
      }
      // 3. Se não tem fromMe, verificar direction
      else if (actualMessage.direction) {
        isOutbound =
          actualMessage.direction === "OUTBOUND" ||
          actualMessage.direction === "outbound";
        console.log(
          "🎯 Direção determinada pelo campo 'direction':",
          actualMessage.direction,
          "-> isOutbound:",
          isOutbound
        );
      }
      // 4. Analisar from/to para WhatsApp
      else if (actualMessage.from && actualMessage.to) {
        // Se o 'to' termina com @c.us, provavelmente é uma mensagem enviada
        isOutbound = actualMessage.to.includes("@c.us");
        console.log(
          "🎯 Direção determinada por from/to:",
          { from: actualMessage.from, to: actualMessage.to },
          "-> isOutbound:",
          isOutbound
        );
      }
      // 5. Fallback: assumir como recebida se não conseguir determinar
      else {
        isOutbound = false;
        console.warn(
          "⚠️ Não foi possível determinar a direção da mensagem, assumindo como INBOUND"
        );
      }

      console.log("🏁 RESULTADO FINAL da detecção:", {
        isOutbound,
        direction: isOutbound
          ? "OUTBOUND (sua mensagem)"
          : "INBOUND (mensagem do usuário)",
      });

      let targetTicketId = message.ticketId;

      // MELHORIA: Fallback para buscar ticket por contactId quando ticketId não estiver presente
      if (!targetTicketId && message.contactId) {
        console.log(
          "⚠️ Mensagem sem ticketId, buscando por contactId:",
          message.contactId
        );

        // Verificar na lista de tickets atual se existe algum para este contato
        const { tickets } = useTickets.getState();
        const matchingTicket = tickets.find(
          (t) =>
            t.contact.id === message.contactId &&
            ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(t.status)
        );

        if (matchingTicket) {
          targetTicketId = matchingTicket.id;
          console.log("✅ Encontrado ticket correspondente:", targetTicketId);
        } else {
          console.warn(
            "❌ Não foi possível encontrar ticket para contactId:",
            message.contactId
          );
        }
      }

      // Processar mensagem se tiver ticketId (original ou encontrado por fallback)
      if (targetTicketId) {
        try {
          // Criar objeto da mensagem compatível com TicketMessage usando a mensagem correta
          const messageData: any = {
            id: actualMessage.id || message.id || `temp_${Date.now()}`,
            ticketId: targetTicketId,
            contactId: message.contactId || "",
            content:
              actualMessage.body ||
              actualMessage.content ||
              message.content ||
              "",
            messageType:
              actualMessage.messageType || message.messageType || "TEXT",
            // CORREÇÃO: Usar o resultado da detecção aprimorada
            direction: isOutbound ? "OUTBOUND" : "INBOUND",
            status: actualMessage.status || message.status || "DELIVERED",
            isFromBot: actualMessage.isFromBot || message.isFromBot || false,
            botFlowId: actualMessage.botFlowId || message.botFlowId,
            createdAt:
              actualMessage.createdAt ||
              message.createdAt ||
              actualMessage.timestamp ||
              message.timestamp ||
              new Date().toISOString(),
            updatedAt:
              actualMessage.updatedAt ||
              message.updatedAt ||
              actualMessage.timestamp ||
              message.timestamp ||
              new Date().toISOString(),
          };

          console.log(
            "📨 Processando mensagem para ticket:",
            targetTicketId,
            messageData,
            "Direção:",
            isOutbound
              ? "OUTBOUND (sua mensagem)"
              : "INBOUND (mensagem do usuário)"
          );

          // Atualizar ticket na lista se tiver ticketId válido
          if (targetTicketId) {
            addMessageToTicket(targetTicketId, messageData);
          }

          // Se é o ticket selecionado, adicionar ao chat
          if (selectedTicket?.id === targetTicketId) {
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

        // 4. Iniciar monitoramento de saúde do socket
        socketService.startHealthMonitoring(15000); // Verificar a cada 15 segundos

        // 5. Verificar estado após inicialização
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
      socketService.stopHealthMonitoring(); // Parar monitoramento ao desmontar
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
