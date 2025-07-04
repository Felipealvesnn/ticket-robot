import { socketService } from "@/services/socket";
import {
  FlowExecutionEvent,
  MessageDeliveryEvent,
  MessageEvent,
  TicketStatusEvent,
} from "@/types/socket";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface SocketState {
  // Estado da conexão
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;

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

      // Inicialização (apenas para tickets, mensagens e flows)
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

        console.log("✅ Socket Store inicializado (tickets, mensagens, flows)");
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
