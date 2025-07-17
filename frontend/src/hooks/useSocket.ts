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
 * ✅ EVITA MÚLTIPLAS CONEXÕES com sistema de referência
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { handleNewMessage, handleTicketUpdate, handleNewTicket } =
    useTickets();
  const { updateSelectedTicket } = useSelectedTicket();
  const { updateSessionStatus, setSessionQrCode } = useSessionsStore();

  // ✅ USAR useRef para evitar recriação desnecessária
  const connectionsRef = useRef(0);
  const isInitializedRef = useRef(false);

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
   * ✅ OTIMIZADO: Só permite uma conexão por vez
   */
  const connect = useCallback(async () => {
    if (!user || isConnecting || isConnected) return;

    // ✅ INCREMENTAR contador para rastrear uso
    connectionsRef.current++;
    console.log(`🔌 useSocket: Conexão solicitada (${connectionsRef.current})`);

    // ✅ SE JÁ ESTÁ INICIALIZADO, apenas retornar estados atuais
    if (isInitializedRef.current) {
      console.log("🔌 useSocket: Socket já inicializado, reutilizando...");
      setIsConnected(socketManager.isConnected());
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const token = getToken();
      if (!token) {
        throw new Error("Token não encontrado");
      }

      // ✅ MARCAR COMO INICIALIZADO ANTES da conexão
      isInitializedRef.current = true;

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
          console.log("📨 useSocket: Mensagem recebida:", message.id);

          // ✅ LÓGICA SIMPLIFICADA - UMA ÚNICA FUNÇÃO
          if (message.ticketId) {
            console.log("🎯 useSocket: Chamando handleNewMessage...");
            handleNewMessage(message);
            console.log("🎯 useSocket: handleNewMessage executado");
          } else {
            console.warn(
              "⚠️ useSocket: Mensagem sem ticketId ignorada:",
              message
            );
          }
        },

        onSessionStatus: (status: SessionStatus) => {
          // ✅ ATUALIZAR STORE DE SESSÕES COM QR CODE E STATUS
          updateSessionStatus(status.sessionId, status.status, status.error);

          // Se tem QR Code, atualizar no store
          if (status.qrCode) {
            setSessionQrCode(status.sessionId, status.qrCode);
            console.log(
              "✅ QR Code SALVO no store para sessão:",
              status.sessionId
            );
          }
        },

        onTicketUpdate: (update: TicketUpdate) => {
          console.log("🎫 Ticket atualizado:", update);
          handleTicketUpdate(update.ticketId, update);

          // Se é o ticket selecionado, atualizar também
          const selectedTicket = useSelectedTicket.getState().selectedTicket;
          if (selectedTicket?.id === update.ticketId) {
            const validUpdate: Partial<any> = {};
            if (update.status) validUpdate.status = update.status;
            if (update.assignedTo) validUpdate.assignedTo = update.assignedTo;
            if (update.lastMessageAt)
              validUpdate.lastMessageAt = update.lastMessageAt;

            updateSelectedTicket(validUpdate);
          }
        },

        onNewTicket: (newTicketData: NewTicket) => {
          console.log("🆕 Novo ticket recebido:", newTicketData);
          handleNewTicket(newTicketData);
        },
      });
    } catch (error: any) {
      console.error("❌ Erro ao conectar socket:", error);
      setError(error.message);
      setIsConnecting(false);
      setIsConnected(false);
      isInitializedRef.current = false; // Reset em caso de erro
    }
  }, [
    user,
    isConnecting,
    isConnected,
    getToken,
    handleNewMessage,
    handleTicketUpdate,
    handleNewTicket,
    updateSelectedTicket,
    updateSessionStatus,
    setSessionQrCode,
  ]);

  /**
   * Desconecta do socket
   * ✅ OTIMIZADO: Só desconecta quando nenhum componente está usando
   */
  const disconnect = useCallback(() => {
    connectionsRef.current = Math.max(0, connectionsRef.current - 1);
    console.log(
      `🔌 useSocket: Desconexão solicitada (${connectionsRef.current})`
    );

    // ✅ SÓ DESCONECTAR se não há mais nenhum componente usando
    if (connectionsRef.current === 0) {
      console.log("🔌 useSocket: Desconectando socket (última referência)");
      socketManager.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
      isInitializedRef.current = false;
    }
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
   * ✅ OTIMIZADO: Decrementa contador em vez de desconectar imediatamente
   */
  useEffect(() => {
    return () => {
      connectionsRef.current = Math.max(0, connectionsRef.current - 1);
      console.log(`🧹 useSocket: Cleanup (${connectionsRef.current})`);

      // ✅ SÓ DESCONECTAR se não há mais referências
      if (connectionsRef.current === 0) {
        console.log(
          "🧹 useSocket: Desconectando na limpeza (última referência)"
        );
        socketManager.disconnect();
        isInitializedRef.current = false;
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
