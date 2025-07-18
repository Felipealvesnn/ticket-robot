"use client";

import socketManager, {
  NewTicket,
  SessionStatus,
  SocketMessage,
  TicketUpdate,
} from "@/services/socketManager";
import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useSelectedTicket, useTickets } from "@/store/tickets";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 🚀 HOOK UNIFICADO DE SOCKET - REFATORADO
 * ✅ CORRIGE problemas de dependências circulares
 * ✅ ELIMINA código duplicado
 * ✅ OTIMIZA performance e estabilidade
 */
export function useSocket() {
  // ===== ESTADOS =====
  const [isConnected, setIsConnected] = useState(() =>
    socketManager.isConnected()
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();

  // ===== REFS PARA ESTADO ESTÁVEL =====
  const isInitializedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // 🔥 CRÍTICO: Obter funções dos stores de forma estável
  const getStoreActions = useCallback(() => {
    const ticketsStore = useTickets.getState();
    const selectedTicketStore = useSelectedTicket.getState();
    const sessionsStore = useSessionsStore.getState();

    return {
      handleNewMessage: ticketsStore.handleNewMessage,
      handleTicketUpdate: ticketsStore.handleTicketUpdate,
      handleNewTicket: ticketsStore.handleNewTicket,
      updateSelectedTicket: selectedTicketStore.updateSelectedTicket,
      updateSessionStatus: sessionsStore.updateSessionStatus,
      setSessionQrCode: sessionsStore.setSessionQrCode,
    };
  }, []);

  /**
   * 🔥 FUNÇÃO CENTRAL DE CONEXÃO - SIMPLIFICADA
   */
  const connectSocket = useCallback(async () => {
    if (
      !user?.id ||
      isConnecting ||
      (isConnected && isInitializedRef.current)
    ) {
      console.log("🔌 useSocket: Conexão ignorada - condições não atendidas", {
        hasUser: !!user?.id,
        isConnecting,
        isConnected,
        isInitialized: isInitializedRef.current,
      });
      return;
    }

    // ✅ VERIFICAR se mudou de usuário
    if (currentUserIdRef.current && currentUserIdRef.current !== user.id) {
      console.log("� useSocket: Usuário mudou, desconectando primeiro...");
      socketManager.disconnect();
      isInitializedRef.current = false;
      setIsConnected(false);
    }

    currentUserIdRef.current = user.id;

    try {
      setIsConnecting(true);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      console.log("🔌 useSocket: Iniciando conexão para usuário:", user.id);

      await socketManager.connect(token, {
        onConnect: () => {
          console.log("✅ Socket conectado com sucesso");
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          isInitializedRef.current = true;
        },

        onDisconnect: (reason: string) => {
          console.log("🔌 Socket desconectado:", reason);
          setIsConnected(false);
          setIsConnecting(false);
          if (
            reason === "io server disconnect" ||
            reason === "transport error"
          ) {
            isInitializedRef.current = false;
          }
        },

        onError: (errorMsg) => {
          console.error("❌ Erro no socket:", errorMsg);
          setError(errorMsg);
          setIsConnecting(false);
          setIsConnected(false);
          isInitializedRef.current = false;
        },

        onMessage: (message: SocketMessage) => {
          console.log("📨 useSocket: Mensagem recebida:", {
            id: message.id,
            ticketId: message.ticketId,
            type: message.messageType,
          });

          if (message.ticketId) {
            const actions = getStoreActions();
            actions.handleNewMessage(message);
          } else {
            console.warn("⚠️ useSocket: Mensagem sem ticketId ignorada");
          }
        },

        onSessionStatus: (status: SessionStatus) => {
          console.log(
            "📡 useSocket: Status da sessão:",
            status.sessionId,
            status.status
          );
          const actions = getStoreActions();
          actions.updateSessionStatus(
            status.sessionId,
            status.status,
            status.error
          );

          if (status.qrCode) {
            actions.setSessionQrCode(status.sessionId, status.qrCode);
          }
        },

        onTicketUpdate: (update: TicketUpdate) => {
          console.log("🎫 useSocket: Ticket atualizado:", update.ticketId);
          const actions = getStoreActions();
          actions.handleTicketUpdate(update.ticketId, update);

          // Atualizar ticket selecionado se for o mesmo
          const selectedTicket = useSelectedTicket.getState().selectedTicket;
          if (selectedTicket?.id === update.ticketId) {
            const validUpdate: Partial<any> = {};
            if (update.status) validUpdate.status = update.status;
            if (update.assignedTo) validUpdate.assignedTo = update.assignedTo;
            if (update.lastMessageAt)
              validUpdate.lastMessageAt = update.lastMessageAt;

            if (Object.keys(validUpdate).length > 0) {
              actions.updateSelectedTicket(validUpdate);
            }
          }
        },

        onNewTicket: (newTicketData: NewTicket) => {
          console.log("🆕 useSocket: Novo ticket recebido:", newTicketData);
          const actions = getStoreActions();
          actions.handleNewTicket(newTicketData);
        },
      });
    } catch (error: any) {
      console.error("❌ useSocket: Erro ao conectar:", error);
      setError(error.message || "Erro de conexão");
      setIsConnecting(false);
      setIsConnected(false);
      isInitializedRef.current = false;
      currentUserIdRef.current = null;
    }
  }, [user?.id, isConnecting, isConnected, getStoreActions]);

  /**
   * 🔥 FUNÇÃO DE DESCONEXÃO SIMPLIFICADA
   */
  const disconnectSocket = useCallback(() => {
    console.log("🔌 useSocket: Solicitação de desconexão");

    if (isConnected || isInitializedRef.current) {
      console.log("🔌 useSocket: Desconectando socket...");
      socketManager.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
      isInitializedRef.current = false;
      currentUserIdRef.current = null;
    }
  }, [isConnected]);

  /**
   * 🔥 EFEITO PRINCIPAL - GERENCIA CONEXÃO BASEADO NO USUÁRIO
   * ✅ SEM dependências circulares
   * ✅ Lógica clara e direta
   */
  useEffect(() => {
    // Cenário 1: Usuário logado e não conectado -> CONECTAR
    if (user?.id && !isConnected && !isConnecting) {
      console.log("🔌 useSocket: Usuário logado, conectando...", user.id);
      connectSocket();
    }

    // Cenário 2: Usuário deslogado e conectado -> DESCONECTAR
    else if (!user?.id && (isConnected || isInitializedRef.current)) {
      console.log("🔌 useSocket: Usuário deslogado, desconectando...");
      disconnectSocket();
    }

    // Cenário 3: Usuário mudou -> RECONECTAR
    else if (
      user?.id &&
      currentUserIdRef.current &&
      currentUserIdRef.current !== user.id
    ) {
      console.log("� useSocket: Usuário mudou, reconectando...", {
        anterior: currentUserIdRef.current,
        atual: user.id,
      });
      disconnectSocket();
      // connectSocket será chamado na próxima execução do useEffect
    }
  }, [user?.id, isConnected, isConnecting, connectSocket, disconnectSocket]);

  /**
   * 🔥 CLEANUP no unmount
   */
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        console.log("🔌 useSocket: Cleanup - desconectando socket");
        socketManager.disconnect();
        isInitializedRef.current = false;
        currentUserIdRef.current = null;
      }
    };
  }, []);

  /**
   * 🔥 FUNÇÕES DE GERENCIAMENTO DE SALAS
   */
  const joinSession = useCallback(
    (sessionId: string) => {
      if (isConnected) {
        socketManager.joinSession(sessionId);
        console.log("🏠 useSocket: Entrou na sessão:", sessionId);
      }
    },
    [isConnected]
  );

  const leaveSession = useCallback(
    (sessionId: string) => {
      if (isConnected) {
        socketManager.leaveSession(sessionId);
        console.log("🚪 useSocket: Saiu da sessão:", sessionId);
      }
    },
    [isConnected]
  );

  const joinTicket = useCallback(
    (ticketId: string) => {
      if (isConnected) {
        socketManager.joinTicket(ticketId);
        console.log("🎫 useSocket: Entrou no ticket:", ticketId);
      }
    },
    [isConnected]
  );

  const leaveTicket = useCallback(
    (ticketId: string) => {
      if (isConnected) {
        socketManager.leaveTicket(ticketId);
        console.log("� useSocket: Saiu do ticket:", ticketId);
      }
    },
    [isConnected]
  );

  return {
    // ===== ESTADOS =====
    isConnected,
    isConnecting,
    error,

    // ===== AÇÕES =====
    connect: connectSocket,
    disconnect: disconnectSocket,
    joinSession,
    leaveSession,
    joinTicket,
    leaveTicket,

    // ===== ESTATÍSTICAS =====
    stats: {
      isConnected: socketManager.isConnected(),
      userId: currentUserIdRef.current,
      isInitialized: isInitializedRef.current,
    },
  };
}

export default useSocket;
