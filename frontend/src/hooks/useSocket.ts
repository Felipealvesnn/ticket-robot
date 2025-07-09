"use client";

import socketManager, {
  SessionStatus,
  SocketMessage,
  TicketUpdate,
} from "@/services/socketManager";
import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useSelectedTicket, useTickets } from "@/store/tickets";
import { useCallback, useEffect, useState } from "react";

/**
 * 🚀 HOOK UNIFICADO DE SOCKET
 * Substitui TODOS os outros hooks de socket:
 * - useRealtime
 * - useSocketManager
 * - useSocketStore
 * - useSocketInitializer
 * - useSocketSessions
 * - useRealtimeSystem
 *
 * ✅ PADRÃO ÚNICO para usar Socket.IO em todo o app
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { handleNewMessage, handleTicketUpdate } = useTickets();
  const { updateSelectedTicket } = useSelectedTicket();
  const { updateSessionStatus, setSessionQrCode } = useSessionsStore();

  /**
   * Obtém o token do localStorage
   */
  const getToken = useCallback(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;
  }, []);

  /**
   * Conecta ao socket
   */
  const connect = useCallback(async () => {
    if (!user || isConnecting || isConnected) return;

    try {
      setIsConnecting(true);
      setError(null);

      const token = getToken();
      if (!token) {
        throw new Error("Token não encontrado");
      }

      await socketManager.connect(token, {
        onConnect: () => {
          console.log("✅ Socket conectado com sucesso");
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
        },

        onDisconnect: (reason: string) => {
          console.log("🔌 Socket desconectado:", reason);
          setIsConnected(false);
          setIsConnecting(false);
        },

        onError: (errorMsg) => {
          console.error("❌ Erro no socket:", errorMsg);
          setError(errorMsg);
          setIsConnecting(false);
          setIsConnected(false);
        },

        onMessage: (message: SocketMessage) => {
          console.log("💬 Nova mensagem recebida:", message);

          // ✅ LÓGICA SIMPLIFICADA - UMA ÚNICA FUNÇÃO
          if (message.ticketId) {
            // Use apenas handleNewMessage - ela já faz tudo que precisa
            handleNewMessage(message);
          } else {
            console.warn("⚠️ Mensagem sem ticketId ignorada:", message);
          }
        },

        onSessionStatus: (status: SessionStatus) => {
          console.log("📱 Status de sessão atualizado:", status);
          console.log("🔍 QR Code presente?", !!status.qrCode);
          console.log("🔍 SessionId:", status.sessionId);

          // ✅ ATUALIZAR STORE DE SESSÕES COM QR CODE E STATUS
          updateSessionStatus(status.sessionId, status.status, status.error);

          // Se tem QR Code, atualizar no store
          if (status.qrCode) {
            setSessionQrCode(status.sessionId, status.qrCode);
            console.log(
              "✅ QR Code SALVO no store para sessão:",
              status.sessionId
            );
            console.log(
              "🔄 QR Code (primeiros 50 chars):",
              status.qrCode.substring(0, 50)
            );
          } else {
            console.log("⚠️ Nenhum QR Code no status recebido");
          }
        },

        onTicketUpdate: (update: TicketUpdate) => {
          console.log("🎫 Ticket atualizado:", update);
          handleTicketUpdate(update.ticketId, update);

          // Se é o ticket selecionado, atualizar também
          const selectedTicket = useSelectedTicket.getState().selectedTicket;
          if (selectedTicket?.id === update.ticketId) {
            // Converter para o tipo correto
            const validUpdate: Partial<any> = {};
            if (update.status) validUpdate.status = update.status;
            if (update.assignedTo) validUpdate.assignedTo = update.assignedTo;
            if (update.lastMessageAt)
              validUpdate.lastMessageAt = update.lastMessageAt;

            updateSelectedTicket(validUpdate);
          }
        },
      });
    } catch (error: any) {
      console.error("❌ Erro ao conectar socket:", error);
      setError(error.message);
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [
    user,
    isConnecting,
    isConnected,
    getToken,
    handleNewMessage,
    handleTicketUpdate,
    updateSelectedTicket,
    updateSessionStatus,
    setSessionQrCode,
  ]);

  /**
   * Desconecta do socket
   */
  const disconnect = useCallback(() => {
    socketManager.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  }, []);

  /**
   * Entra em uma sessão
   */
  const joinSession = useCallback(
    (sessionId: string) => {
      if (isConnected) {
        socketManager.joinSession(sessionId);
      }
    },
    [isConnected]
  );

  /**
   * Sai de uma sessão
   */
  const leaveSession = useCallback(
    (sessionId: string) => {
      if (isConnected) {
        socketManager.leaveSession(sessionId);
      }
    },
    [isConnected]
  );

  /**
   * Entra em um ticket
   */
  const joinTicket = useCallback(
    (ticketId: string) => {
      if (isConnected) {
        socketManager.joinTicket(ticketId);
      }
    },
    [isConnected]
  );

  /**
   * Sai de um ticket
   */
  const leaveTicket = useCallback(
    (ticketId: string) => {
      if (isConnected) {
        socketManager.leaveTicket(ticketId);
      }
    },
    [isConnected]
  );

  /**
   * Conecta automaticamente quando o usuário está logado
   */
  useEffect(() => {
    if (user && !isConnected && !isConnecting) {
      connect();
    }
  }, [user, isConnected, isConnecting, connect]);

  /**
   * Desconecta quando o usuário faz logout
   */
  useEffect(() => {
    if (!user && isConnected) {
      disconnect();
    }
  }, [user, isConnected, disconnect]);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, []);

  return {
    // Estados
    isConnected,
    isConnecting,
    error,

    // Ações
    connect,
    disconnect,
    joinSession,
    leaveSession,
    joinTicket,
    leaveTicket,

    // Estatísticas
    stats: {
      isConnected: socketManager.isConnected(),
    },
  };
}

export default useSocket;
