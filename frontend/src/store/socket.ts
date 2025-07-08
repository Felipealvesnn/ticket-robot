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

  // Integração com tickets
  handleNewMessageForTickets: (message: MessageEvent) => void;

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

      // Integração com tickets e mensagens
      handleNewMessageForTickets: (message) => {
        try {
          console.log("🔄 Integrando nova mensagem com stores:", message);

          // Importação dinâmica para evitar dependência circular
          Promise.all([import("./tickets"), import("./messages")]).then(
            ([ticketsModule, messagesModule]) => {
              const { useSelectedTicket, useTickets } = ticketsModule;
              const { useMessagesStore } = messagesModule;

              const selectedTicketStore = useSelectedTicket.getState();
              const ticketsStore = useTickets.getState();
              const messagesStore = useMessagesStore.getState();

              // Converter MessageEvent para o formato correto do Message
              const messageForStore = {
                id: message.id,
                sessionId:
                  selectedTicketStore.selectedTicket?.messagingSession.id || "",
                to: message.contactId,
                from:
                  message.direction === "inbound"
                    ? message.contactId
                    : undefined,
                message: message.content,
                type: message.messageType,
                status: "delivered" as const,
                timestamp: message.timestamp,
                createdAt: message.timestamp,
                updatedAt: message.timestamp,
              };

              // Determinar se a mensagem é própria (enviada pelo usuário)
              // Tratar como any para acessar campos que podem não estar definidos na interface
              const msgAny = message as any;

              const isOutbound =
                message.direction === "outbound" ||
                msgAny.fromMe === true ||
                (msgAny.from &&
                  msgAny.to &&
                  typeof msgAny.to === "string" &&
                  msgAny.to.includes("@c.us"));

              console.log("🔍 Detecção de direção da mensagem:", {
                id: message.id,
                direction: message.direction,
                fromMe: msgAny.fromMe,
                from: msgAny.from,
                to: msgAny.to,
                isOutbound: isOutbound,
              });

              // Adicionar mensagem ao store de mensagens
              messagesStore.addMessage(messageForStore);

              // Se é uma mensagem do ticket atualmente selecionado, adicionar ao chat
              if (selectedTicketStore.selectedTicket?.id === message.ticketId) {
                const ticketMessage: any = {
                  id: message.id,
                  ticketId: message.ticketId,
                  contactId: message.contactId || "",
                  content: message.content || msgAny.body || "",
                  messageType: (message.messageType || "TEXT") as any,
                  // Garantir que mensagens próprias sejam OUTBOUND
                  direction: isOutbound ? "OUTBOUND" : "INBOUND",
                  status: "DELIVERED" as const,
                  isFromBot: message.isFromBot || false,
                  createdAt: message.timestamp,
                  updatedAt: message.timestamp,
                };

                // Adicionar mensagem ao chat ativo
                selectedTicketStore.addMessageToChat(ticketMessage);
              }

              // Atualizar lastMessageAt do ticket na lista principal
              if (message.ticketId) {
                ticketsStore.updateTicketInList(message.ticketId, {
                  lastMessageAt: message.timestamp,
                });
              }

              console.log(
                `✅ Mensagem integrada com todos os stores para ticket ${message.ticketId}`
              );
            }
          );
        } catch (error) {
          console.error("❌ Erro ao integrar mensagem com stores:", error);
        }
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
        socket.on("new-message", (data) => {
          console.log("📨 Nova mensagem recebida via socket:", data);

          // Adicionar mensagem ao store do socket
          get().addMessage(data);

          // Integrar com o store de tickets para atualizar o chat ativo
          get().handleNewMessageForTickets(data);
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
