"use client";

import { socketService } from "@/services/socket";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ===== TIPOS UNIFICADOS =====
export interface UnifiedMessage {
  id: string;
  ticketId?: string;
  sessionId?: string;
  contactId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  direction: "INBOUND" | "OUTBOUND";
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  isFromBot: boolean;
  botFlowId?: string;
  createdAt: string;
  updatedAt: string;
  // Campos específicos do WhatsApp
  from?: string;
  to?: string;
  timestamp?: string;
}

export interface SessionStatus {
  sessionId: string;
  status: "connecting" | "connected" | "disconnected" | "error";
  lastActivity?: string;
  error?: string;
  qrCode?: string;
  qrCodeTimestamp?: string;
}

// ===== ESTADO DO STORE =====
interface RealtimeState {
  // Conexão
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;

  // Sessões monitoradas
  monitoredSessions: string[];
  sessionStatuses: Record<string, SessionStatus>;

  // Tickets ativos
  activeTickets: string[];

  // Mensagens em tempo real (últimas 100 por sessão/ticket)
  recentMessages: Record<string, UnifiedMessage[]>;

  // Status de entrega de mensagens
  messageDeliveries: Record<
    string,
    {
      status: "sent" | "delivered" | "read" | "failed";
      timestamp: string;
      error?: string;
    }
  >;
}

interface RealtimeActions {
  // Conexão
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  // Gerenciamento de sessões
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  updateSessionStatus: (
    sessionId: string,
    status: Partial<SessionStatus>
  ) => void;
  setSessionQrCode: (sessionId: string, qrCode: string) => void;
  clearSessionQrCode: (sessionId: string) => void;

  // Gerenciamento de tickets
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;

  // Mensagens
  addMessage: (message: UnifiedMessage) => void;
  updateMessageDelivery: (
    messageId: string,
    status: string,
    error?: string
  ) => void;
  getMessagesForContext: (contextId: string) => UnifiedMessage[];

  // Inicialização
  initialize: () => void;
  cleanup: () => void;

  // Callbacks para integração com outros stores
  onNewMessage?: (message: UnifiedMessage) => void;
  onSessionStatusChange?: (sessionId: string, status: SessionStatus) => void;
  onTicketUpdate?: (ticketId: string, updates: any) => void;
}

const initialState: RealtimeState = {
  isConnected: false,
  error: null,
  reconnectAttempts: 0,
  monitoredSessions: [],
  sessionStatuses: {},
  activeTickets: [],
  recentMessages: {},
  messageDeliveries: {},
};

export const useRealtimeStore = create<RealtimeState & RealtimeActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ===== CONEXÃO =====
      setConnected: (isConnected) => {
        set({ isConnected });
        if (isConnected) {
          set({ error: null, reconnectAttempts: 0 });
          console.log("🔗 Realtime conectado");
        } else {
          console.log("🔌 Realtime desconectado");
        }
      },

      setError: (error) => {
        set({ error });
        if (error) {
          console.error("❌ Erro no realtime:", error);
        }
      },

      incrementReconnectAttempts: () => {
        set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 }));
      },

      resetReconnectAttempts: () => {
        set({ reconnectAttempts: 0 });
      },

      // ===== SESSÕES =====
      joinSession: (sessionId) => {
        const { monitoredSessions } = get();
        if (!monitoredSessions.includes(sessionId)) {
          set({
            monitoredSessions: [...monitoredSessions, sessionId],
          });
          socketService.joinSession(sessionId);
          console.log(`📱 Monitorando sessão: ${sessionId}`);
        }
      },

      leaveSession: (sessionId) => {
        const { monitoredSessions, sessionStatuses, recentMessages } = get();

        // Remover da lista de monitoramento
        const newMonitoredSessions = monitoredSessions.filter(
          (id) => id !== sessionId
        );

        // Limpar dados da sessão
        const newStatuses = { ...sessionStatuses };
        const newMessages = { ...recentMessages };
        delete newStatuses[sessionId];
        delete newMessages[sessionId];

        set({
          monitoredSessions: newMonitoredSessions,
          sessionStatuses: newStatuses,
          recentMessages: newMessages,
        });

        socketService.leaveSession(sessionId);
        console.log(`📱 Parou de monitorar sessão: ${sessionId}`);
      },

      updateSessionStatus: (sessionId, statusUpdate) => {
        const { sessionStatuses, onSessionStatusChange } = get();

        const currentStatus = sessionStatuses[sessionId];
        const newStatus: SessionStatus = {
          sessionId,
          status: "disconnected",
          lastActivity: new Date().toISOString(),
          ...currentStatus,
          ...statusUpdate,
        };

        set({
          sessionStatuses: {
            ...sessionStatuses,
            [sessionId]: newStatus,
          },
        });

        // Callback para outros stores
        if (onSessionStatusChange) {
          onSessionStatusChange(sessionId, newStatus);
        }

        console.log(`📊 Status da sessão ${sessionId}:`, newStatus.status);
      },

      setSessionQrCode: (sessionId, qrCode) => {
        get().updateSessionStatus(sessionId, {
          qrCode,
          qrCodeTimestamp: new Date().toISOString(),
        });
      },

      clearSessionQrCode: (sessionId) => {
        get().updateSessionStatus(sessionId, {
          qrCode: undefined,
          qrCodeTimestamp: undefined,
        });
      },

      // ===== TICKETS =====
      joinTicket: (ticketId) => {
        const { activeTickets } = get();
        if (!activeTickets.includes(ticketId)) {
          set({
            activeTickets: [...activeTickets, ticketId],
          });
          socketService.joinTicket(ticketId);
          console.log(`🎫 Monitorando ticket: ${ticketId}`);
        }
      },

      leaveTicket: (ticketId) => {
        const { activeTickets, recentMessages } = get();

        // Remover da lista de tickets ativos
        const newActiveTickets = activeTickets.filter((id) => id !== ticketId);

        // Manter mensagens (não limpar, pode ser útil)
        set({
          activeTickets: newActiveTickets,
        });

        socketService.leaveTicket(ticketId);
        console.log(`🎫 Parou de monitorar ticket: ${ticketId}`);
      },

      // ===== MENSAGENS =====
      addMessage: (message) => {
        const { recentMessages, onNewMessage } = get();

        // Determinar a chave do contexto (sessionId ou ticketId)
        const contextId =
          message.ticketId || message.sessionId || message.contactId;
        if (!contextId) {
          console.warn("⚠️ Mensagem sem contexto válido:", message);
          return;
        }

        // Adicionar à lista de mensagens do contexto
        const contextMessages = recentMessages[contextId] || [];
        const maxMessages = 100; // Manter apenas as últimas 100 mensagens

        // Verificar se já existe para evitar duplicatas
        const messageExists = contextMessages.some((m) => m.id === message.id);
        if (messageExists) {
          return;
        }

        const updatedMessages = [...contextMessages, message]
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .slice(-maxMessages);

        set({
          recentMessages: {
            ...recentMessages,
            [contextId]: updatedMessages,
          },
        });

        // Callback para outros stores
        if (onNewMessage) {
          onNewMessage(message);
        }

        console.log(
          `📨 Nova mensagem no contexto ${contextId}:`,
          message.content.substring(0, 50)
        );
      },

      updateMessageDelivery: (messageId, status, error) => {
        const { messageDeliveries } = get();

        set({
          messageDeliveries: {
            ...messageDeliveries,
            [messageId]: {
              status: status as any,
              timestamp: new Date().toISOString(),
              error,
            },
          },
        });

        console.log(`📬 Status da mensagem ${messageId}:`, status);
      },

      getMessagesForContext: (contextId) => {
        const { recentMessages } = get();
        return recentMessages[contextId] || [];
      },

      // ===== INICIALIZAÇÃO =====
      initialize: () => {
        console.log("🚀 Inicializando sistema de tempo real...");

        const socket = socketService.getSocket();
        if (!socket) {
          console.error("❌ Socket não disponível");
          return;
        }

        // Verificar se já está conectado e atualizar o estado
        if (socket.connected) {
          console.log("✅ Socket já conectado, atualizando estado...");
          get().setConnected(true);
        } else {
          console.log("⏳ Socket não conectado ainda, aguardando...");
          get().setConnected(false);
        }

        // Eventos de conexão
        socket.on("connect", () => {
          console.log("🔌 Socket conectado - atualizando estado");
          get().setConnected(true);
        });

        socket.on("disconnect", () => {
          console.log("🔌 Socket desconectado - atualizando estado");
          get().setConnected(false);
        });

        socket.on("connect_error", (error) => {
          console.log("❌ Erro de conexão - atualizando estado");
          get().setError(error.message);
          get().incrementReconnectAttempts();
        });

        // Eventos de sessão
        socket.on("session:status", (data) => {
          get().updateSessionStatus(data.sessionId, {
            status: data.status,
            error: data.error,
          });
        });

        socket.on("session:qr", (data) => {
          get().setSessionQrCode(data.sessionId, data.qrCode);
        });

        // Eventos de mensagem
        socket.on("new-message", (data) => {
          // Normalizar dados para UnifiedMessage
          const message: UnifiedMessage = {
            id: data.id || `temp_${Date.now()}`,
            ticketId: data.ticketId,
            sessionId: data.sessionId,
            contactId: data.contactId || data.from || data.to || "",
            content: data.content || data.message || "",
            messageType: data.messageType || data.type || "TEXT",
            direction: data.direction || (data.from ? "INBOUND" : "OUTBOUND"),
            status: data.status || "DELIVERED",
            isFromBot: data.isFromBot || false,
            botFlowId: data.botFlowId,
            createdAt:
              data.createdAt || data.timestamp || new Date().toISOString(),
            updatedAt:
              data.updatedAt || data.timestamp || new Date().toISOString(),
            from: data.from,
            to: data.to,
            timestamp: data.timestamp,
          };

          get().addMessage(message);
        });

        socket.on("message:delivery", (data) => {
          get().updateMessageDelivery(data.messageId, data.status, data.error);
        });

        // Eventos de ticket
        socket.on("ticket:updated", (data) => {
          const { onTicketUpdate } = get();
          if (onTicketUpdate) {
            onTicketUpdate(data.ticketId, data);
          }
        });

        console.log("✅ Sistema de tempo real inicializado");
      },

      cleanup: () => {
        console.log("🧹 Limpando sistema de tempo real...");

        const socket = socketService.getSocket();
        if (socket) {
          socket.off("connect");
          socket.off("disconnect");
          socket.off("connect_error");
          socket.off("session:status");
          socket.off("session:qr");
          socket.off("new-message");
          socket.off("message:delivery");
          socket.off("ticket:updated");
        }

        // Limpar estado
        set(initialState);
      },
    }),
    {
      name: "realtime-store",
    }
  )
);
