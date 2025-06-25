import { socketService } from "@/services/socket";
import {
  FlowExecutionEvent,
  MessageDeliveryEvent,
  MessageEvent,
  SessionStatusEvent,
  TicketStatusEvent,
} from "@/types/socket";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface SocketState {
  // Estado da conexão
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;

  // Sessões ativas
  activeSessions: string[];
  sessionStatuses: Record<
    string,
    {
      status: "connecting" | "connected" | "disconnected" | "error";
      qrCode?: string;
      error?: string;
    }
  >;

  // Tickets ativos
  activeTickets: string[];
  ticketStatuses: Record<
    string,
    {
      status: "open" | "pending" | "closed";
      updatedAt: string;
    }
  >;

  // Mensagens recentes (por ticket)
  recentMessages: Record<string, MessageEvent[]>;

  // Estado de delivery das mensagens
  messageDeliveries: Record<
    string,
    {
      status: "sent" | "delivered" | "read" | "failed";
      timestamp: string;
      error?: string;
    }
  >;

  // Execuções de flow
  flowExecutions: Record<string, FlowExecutionEvent[]>;
}

interface SocketActions {
  // Ações de conexão
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setReconnectAttempts: (attempts: number) => void;

  // Ações de sessão
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  updateSessionStatus: (data: SessionStatusEvent) => void;
  setSessionQrCode: (sessionId: string, qrCode: string) => void;

  // Ações de ticket
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
  updateTicketStatus: (data: TicketStatusEvent) => void;

  // Ações de mensagem
  addMessage: (message: MessageEvent) => void;
  updateMessageDelivery: (data: MessageDeliveryEvent) => void;
  sendMessage: (
    ticketId: string,
    content: string,
    messageType?: string
  ) => boolean;

  // Ações de flow
  addFlowExecution: (data: FlowExecutionEvent) => void;

  // Inicialização e limpeza
  initializeSocket: () => void;
  clearState: () => void;
}

const initialState: SocketState = {
  isConnected: false,
  error: null,
  reconnectAttempts: 0,
  activeSessions: [],
  sessionStatuses: {},
  activeTickets: [],
  ticketStatuses: {},
  recentMessages: {},
  messageDeliveries: {},
  flowExecutions: {},
};

export const useSocketStore = create<SocketState & SocketActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Ações de conexão
      setConnected: (isConnected) => {
        set({ isConnected: isConnected });
        if (isConnected) {
          set({ error: null, reconnectAttempts: 0 });
        }
      },

      setError: (error) => set({ error }),

      setReconnectAttempts: (reconnectAttempts) => set({ reconnectAttempts }),

      // Ações de sessão
      joinSession: (sessionId) => {
        const { activeSessions } = get();
        if (!activeSessions.includes(sessionId)) {
          set({
            activeSessions: [...activeSessions, sessionId],
          });
          socketService.joinSession(sessionId);
        }
      },

      leaveSession: (sessionId) => {
        const { activeSessions, sessionStatuses } = get();
        const newActiveSessions = activeSessions.filter(
          (id) => id !== sessionId
        );
        const newSessionStatuses = { ...sessionStatuses };
        delete newSessionStatuses[sessionId];

        set({
          activeSessions: newActiveSessions,
          sessionStatuses: newSessionStatuses,
        });
        socketService.leaveSession(sessionId);
      },

      updateSessionStatus: (data) => {
        const { sessionStatuses } = get();
        set({
          sessionStatuses: {
            ...sessionStatuses,
            [data.sessionId]: {
              status: data.status,
              qrCode: data.qrCode,
              error: data.error,
            },
          },
        });
      },

      setSessionQrCode: (sessionId, qrCode) => {
        const { sessionStatuses } = get();
        set({
          sessionStatuses: {
            ...sessionStatuses,
            [sessionId]: {
              ...sessionStatuses[sessionId],
              qrCode,
            },
          },
        });
      },

      // Ações de ticket
      joinTicket: (ticketId) => {
        const { activeTickets } = get();
        if (!activeTickets.includes(ticketId)) {
          set({
            activeTickets: [...activeTickets, ticketId],
          });
          socketService.joinTicket(ticketId);
        }
      },

      leaveTicket: (ticketId) => {
        const { activeTickets, ticketStatuses, recentMessages } = get();
        const newActiveTickets = activeTickets.filter((id) => id !== ticketId);
        const newTicketStatuses = { ...ticketStatuses };
        const newRecentMessages = { ...recentMessages };

        delete newTicketStatuses[ticketId];
        delete newRecentMessages[ticketId];

        set({
          activeTickets: newActiveTickets,
          ticketStatuses: newTicketStatuses,
          recentMessages: newRecentMessages,
        });
        socketService.leaveTicket(ticketId);
      },

      updateTicketStatus: (data) => {
        const { ticketStatuses } = get();
        set({
          ticketStatuses: {
            ...ticketStatuses,
            [data.ticketId]: {
              status: data.status,
              updatedAt: data.updatedAt,
            },
          },
        });
      },

      // Ações de mensagem
      addMessage: (message) => {
        const { recentMessages } = get();
        const ticketMessages = recentMessages[message.ticketId] || [];
        const maxMessages = 50; // Manter apenas as últimas 50 mensagens

        const updatedMessages = [...ticketMessages, message]
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .slice(-maxMessages);

        set({
          recentMessages: {
            ...recentMessages,
            [message.ticketId]: updatedMessages,
          },
        });
      },

      updateMessageDelivery: (data) => {
        const { messageDeliveries } = get();
        set({
          messageDeliveries: {
            ...messageDeliveries,
            [data.messageId]: {
              status: data.status,
              timestamp: data.timestamp,
              error: data.error,
            },
          },
        });
      },

      sendMessage: (ticketId, content, messageType = "text") => {
        if (!socketService.isConnected()) {
          console.warn("Socket não conectado. Mensagem não enviada.");
          return false;
        }

        socketService.emit("message:send", {
          ticketId,
          content,
          messageType,
        });

        return true;
      },

      // Ações de flow
      addFlowExecution: (data) => {
        const { flowExecutions } = get();
        const ticketExecutions = flowExecutions[data.ticketId] || [];
        const maxExecutions = 20; // Manter apenas as últimas 20 execuções

        const updatedExecutions = [...ticketExecutions, data].slice(
          -maxExecutions
        );

        set({
          flowExecutions: {
            ...flowExecutions,
            [data.ticketId]: updatedExecutions,
          },
        });
      },

      // Inicialização
      initializeSocket: () => {
        const socket = socketService.getSocket();
        if (!socket) return;

        // Eventos de conexão
        socket.on("connect", () => {
          get().setConnected(true);
        });

        socket.on("disconnect", () => {
          get().setConnected(false);
        });

        socket.on("connect_error", (error) => {
          get().setError(error.message);
        });

        // Eventos de sessão
        socket.on("session:status", (data) => {
          get().updateSessionStatus(data);
        });

        socket.on("session:qr-code", (data) => {
          get().setSessionQrCode(data.sessionId, data.qrCode);
        });

        // Eventos de ticket
        socket.on("ticket:updated", (data) => {
          get().updateTicketStatus(data);
        });

        // Eventos de mensagem
        socket.on("message:new", (data) => {
          get().addMessage(data);
        });

        socket.on("message:delivery", (data) => {
          get().updateMessageDelivery(data);
        });

        // Eventos de flow
        socket.on("flow:execution", (data) => {
          get().addFlowExecution(data);
        });

        // Eventos de erro
        socket.on("error", (data) => {
          get().setError(data.message);
        });
      },

      // Limpeza
      clearState: () => {
        set(initialState);
      },
    }),
    {
      name: "socket-store",
    }
  )
);
