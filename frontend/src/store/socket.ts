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

              // CORREÇÃO: Lógica mais robusta para determinar a direção da mensagem
              // Tratar como any para acessar campos que podem não estar definidos na interface
              const msgAny = message as any;

              // Se a mensagem vem dentro de um objeto 'message'
              let actualMessage = msgAny;
              if (msgAny.message && typeof msgAny.message === "object") {
                console.log(
                  "🔍 Socket - Mensagem aninhada detectada, usando message.message"
                );
                actualMessage = msgAny.message;
              }

              let isOutbound = false;

              // 1. PRIORIDADE: Verificar isMe primeiro (campo adicionado no backend)
              if (actualMessage.isMe !== undefined) {
                isOutbound = actualMessage.isMe === true;
                console.log(
                  "🎯 Socket - Direção determinada pelo campo 'isMe':",
                  actualMessage.isMe,
                  "-> isOutbound:",
                  isOutbound
                );
              }
              // 2. Verificar fromMe (campo nativo do WhatsApp)
              else if (actualMessage.fromMe !== undefined) {
                isOutbound = actualMessage.fromMe === true;
                console.log(
                  "🎯 Socket - Direção determinada pelo campo 'fromMe':",
                  actualMessage.fromMe,
                  "-> isOutbound:",
                  isOutbound
                );
              }
              // 3. Se não tem fromMe, verificar direction
              else if (actualMessage.direction || message.direction) {
                const dir = actualMessage.direction || message.direction;
                isOutbound = dir === "outbound" || dir === "OUTBOUND";
                console.log(
                  "🎯 Socket - Direção determinada pelo campo 'direction':",
                  dir,
                  "-> isOutbound:",
                  isOutbound
                );
              }
              // 4. Analisar from/to para WhatsApp
              else if (actualMessage.from && actualMessage.to) {
                // Se o 'to' termina com @c.us, provavelmente é uma mensagem enviada
                isOutbound =
                  typeof actualMessage.to === "string" &&
                  actualMessage.to.includes("@c.us");
                console.log(
                  "🎯 Socket - Direção determinada por from/to:",
                  { from: actualMessage.from, to: actualMessage.to },
                  "-> isOutbound:",
                  isOutbound
                );
              }
              // 5. Fallback: assumir como recebida
              else {
                isOutbound = false;
                console.warn(
                  "⚠️ Socket - Não foi possível determinar a direção da mensagem, assumindo como INBOUND"
                );
              }

            

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
