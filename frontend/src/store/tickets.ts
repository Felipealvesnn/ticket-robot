"use client";

import api from "@/services/api";
import { socketManager } from "@/services/socketManager";
import { create } from "zustand";

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessagingSession {
  id: string;
  name: string;
  platform: string;
  status: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  subject?: string;
  description?: string;
  tags?: string[];
  contact: Contact;
  messagingSession: MessagingSession;
  assignedTo?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  closedAt?: string;
  isFromBot: boolean;

  // Contador de mensagens
  _count?: {
    messages: number;
  };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  contactId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  direction: "INBOUND" | "OUTBOUND";
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  isFromBot: boolean;
  isMe: boolean; // NOVO: Campo para identificar se a mensagem é do próprio usuário
  botFlowId?: string;
  createdAt: string;
  updatedAt: string;
  // Propriedades para mídia
  mediaId?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  mediaMimeType?: string;
  mediaThumbnailUrl?: string;
  // NOVO: Metadata com dados de mídia em base64
  metadata?: {
    whatsappId?: string;
    timestamp?: string;
    media?: {
      fileName: string;
      mimeType: string;
      base64Data: string;
      size: number;
    };
  };
}

export interface MediaMessage {
  id: string;
  ticketId: string;
  contactId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  direction: "INBOUND" | "OUTBOUND";
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  isFromBot: boolean;
  isMe: boolean; // NOVO: Campo para identificar se a mensagem é do próprio usuário
  botFlowId?: string;
  createdAt: string;
  updatedAt: string;
  // Propriedades para mídia
  mediaId?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  mediaMimeType?: string;
  mediaThumbnailUrl?: string;
  // NOVO: Metadata com dados de mídia em base64
  metadata?: {
    whatsappId?: string;
    timestamp?: string;
    media?: {
      fileName: string;
      mimeType: string;
      base64Data: string;
      size: number;
    };
  };
}

export interface SendMediaMessageRequest {
  ticketId: string;
  messageType: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  file: File;
  caption?: string;
}

export interface TicketFilters {
  status?: "ALL" | "OPEN" | "CLOSED";
  priority?: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  search?: string;
  sessionId?: string;
  assignedTo?: string;
  // Novos filtros
  dateRange?: {
    start?: string;
    end?: string;
  };
  tags?: string[];
}

interface TicketsState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  totalTickets: number;
  filters: TicketFilters;

  // ===== PAGINAÇÃO =====
  currentPage: number;
  pageSize: number;
  totalPages: number;

  // ===== CACHE =====
  lastFetch: Date | null;
  cacheExpiry: number;
}

interface TicketsActions {
  setFilters: (filters: Partial<TicketFilters>) => void;
  loadTickets: (page?: number) => Promise<void>;
  reopenTicket: (ticketId: string, reason?: string) => Promise<void>;
  addMessageToTicket: (ticketId: string, message: TicketMessage) => void;
  updateTicketInList: (ticketId: string, updates: Partial<Ticket>) => void;

  // ===== PAGINAÇÃO =====
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refreshTickets: () => Promise<void>;

  // Integração com tempo real
  handleNewMessage: (message: any) => void;
  handleTicketUpdate: (ticketId: string, updates: any) => void;
  handleNewTicket: (newTicketData: any) => void;
}

interface SelectedTicketState {
  selectedTicket: Ticket | null;
  messages: TicketMessage[];
  loadingMessages: boolean;
  sendingMessage: boolean;
}

interface SelectedTicketActions {
  selectTicket: (ticket: Ticket) => void;
  clearSelection: () => void;
  sendMessage: (data: {
    ticketId: string;
    content: string;
    messageType?: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
    file?: File;
  }) => Promise<void>;
  reopenTicket: (ticketId: string, reason?: string) => Promise<void>;
  closeTicket: (ticketId: string, reason?: string) => Promise<void>;
  loadMessages: (ticketId: string) => Promise<void>;

  // Integração com tempo real
  addMessage: (message: TicketMessage) => void;
  updateSelectedTicket: (updates: Partial<Ticket>) => void;
}

// ✅ FUNÇÃO AUXILIAR PARA ORDENAÇÃO DE TICKETS
const sortTicketsByActivity = (tickets: Ticket[]): Ticket[] => {
  console.log(
    "🔄 ANTES da ordenação:",
    tickets.map((t) => ({
      id: t.id.slice(-8),
      contact: t.contact.name,
      lastMessageAt: t.lastMessageAt,
      time: t.lastMessageAt ? new Date(t.lastMessageAt).getTime() : 0,
    }))
  );

  const sorted = [...tickets].sort((a, b) => {
    const aLastMessage = a.lastMessageAt
      ? new Date(a.lastMessageAt).getTime()
      : 0;
    const bLastMessage = b.lastMessageAt
      ? new Date(b.lastMessageAt).getTime()
      : 0;

    if (aLastMessage !== bLastMessage) {
      return bLastMessage - aLastMessage; // Mais recente primeiro
    }

    // Se não há lastMessageAt ou são iguais, usar createdAt
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  console.log(
    "🔄 DEPOIS da ordenação:",
    sorted.map((t) => ({
      id: t.id.slice(-8),
      contact: t.contact.name,
      lastMessageAt: t.lastMessageAt,
      time: t.lastMessageAt ? new Date(t.lastMessageAt).getTime() : 0,
    }))
  );

  return sorted;
};

// Store principal de tickets
export const useTickets = create<TicketsState & TicketsActions>((set, get) => ({
  // Estado inicial
  tickets: [],
  loading: false,
  error: null,
  totalTickets: 0,
  filters: {},
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  lastFetch: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutos

  // Ações
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  loadTickets: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const { filters, pageSize } = get();
      // Chamar API real com paginação e busca
      const response = await api.tickets.getAll(
        filters.status === "ALL" ? undefined : filters.status,
        filters.assignedTo,
        page,
        pageSize,
        filters.search
      );

      // Mapear dados da API para o formato do store
      const tickets: Ticket[] = response.tickets.map((ticket: any) => ({
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        subject: ticket.title || "Sem assunto",
        description: ticket.description,
        tags: [], // TODO: Implementar tags na API
        contact: {
          id: ticket.contact.id,
          name: ticket.contact.name,
          phoneNumber: ticket.contact.phoneNumber,
          email: ticket.contact.email,
          companyId: ticket.contact.companyId || "",
          createdAt: ticket.contact.createdAt || new Date().toISOString(),
          updatedAt: ticket.contact.updatedAt || new Date().toISOString(),
        },
        messagingSession: {
          id: ticket.messagingSession.id,
          name: ticket.messagingSession.name,
          platform: "WHATSAPP", // TODO: Buscar da API
          status: "CONNECTED", // TODO: Buscar da API
          companyId: ticket.messagingSession.companyId || "",
          createdAt:
            ticket.messagingSession.createdAt || new Date().toISOString(),
          updatedAt:
            ticket.messagingSession.updatedAt || new Date().toISOString(),
        },
        assignedTo: ticket.assignedAgent?.id,
        companyId: ticket.companyId || "",
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        lastMessageAt: ticket.lastMessageAt || ticket.updatedAt,
        closedAt: ticket.closedAt,
        isFromBot: false, // TODO: Implementar na API
        _count: ticket._count || { messages: 0 },
      }));

      set({
        tickets: sortTicketsByActivity(tickets),
        totalTickets: response.pagination.total,
        totalPages: response.pagination.totalPages,
        currentPage: response.pagination.page,
        loading: false,
        lastFetch: new Date(),
      });

      console.log(
        `✅ Carregados ${tickets.length} tickets da API (página ${response.pagination.page})`
      );
    } catch (error: any) {
      console.error("❌ Erro ao carregar tickets:", error);
      set({
        error: error.message || "Erro ao carregar tickets",
        loading: false,
      });
    }
  },

  reopenTicket: async (ticketId, reason = "Reaberto pelo atendente") => {
    try {
      // Chamar API real
      await api.tickets.reopen(ticketId, reason);

      console.log(`✅ Ticket ${ticketId} reaberto com sucesso`);

      // Atualizar ticket na lista
      set((state) => ({
        tickets: sortTicketsByActivity(
          state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? { ...ticket, status: "OPEN" as const, closedAt: undefined }
              : ticket
          )
        ),
      }));
    } catch (error: any) {
      console.error("❌ Erro ao reabrir ticket:", error);
      throw error;
    }
  },

  addMessageToTicket: (ticketId, message) => {
    // Esta função será usada pelo sistema de tempo real
    set((state) => ({
      tickets: sortTicketsByActivity(
        state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, lastMessageAt: message.createdAt }
            : ticket
        )
      ),
    }));
  },

  updateTicketInList: (ticketId, updates) => {
    console.log("🎯 updateTicketInList chamado:", {
      ticketId: ticketId.slice(-8),
      updates,
    });
    set((state) => ({
      tickets: sortTicketsByActivity(
        state.tickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, ...updates } : ticket
        )
      ),
    }));
  },

  // ===== PAGINAÇÃO =====
  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    get().loadTickets(page);
  },

  setPageSize: (size: number) => {
    set({ pageSize: size, currentPage: 1 });
    get().loadTickets(1);
  },

  refreshTickets: async () => {
    const { currentPage } = get();
    await get().loadTickets(currentPage);
  },

  // ===== INTEGRAÇÃO COM TEMPO REAL =====

  handleNewMessage: (message) => {
    // ✅ LÓGICA ÚNICA - SEM DUPLICAÇÃO
    // 1. Sempre atualizar lastMessageAt do ticket na lista (já reordena automaticamente)
    if (message.ticketId) {
      console.log("🎫 handleNewMessage: Atualizando lastMessageAt do ticket");

      // Converter createdAt para ISO string se vier como timestamp Unix
      let lastMessageAt: string;
      if (typeof message.createdAt === "number") {
        lastMessageAt = new Date(message.createdAt * 1000).toISOString(); // Unix timestamp em segundos
      } else if (message.createdAt) {
        lastMessageAt = message.createdAt;
      } else {
        lastMessageAt = new Date().toISOString();
      }

      get().updateTicketInList(message.ticketId, {
        lastMessageAt: lastMessageAt,
      });
    } else {
      console.warn("⚠️ handleNewMessage: Mensagem sem ticketId:", message);
    }

    // 2. Se é o ticket selecionado, usar addMessage diretamente
    const selectedTicket = useSelectedTicket.getState().selectedTicket;
    if (selectedTicket && selectedTicket.id === message.ticketId) {
      console.log(
        "🎫 handleNewMessage: Processando mensagem para o ticket selecionado"
      );

      const processedMessage: TicketMessage = {
        id: message.id || `temp_${Date.now()}`,
        ticketId: message.ticketId,
        contactId: message.contactId || "",
        content: message.content || message.body || "",
        messageType: message.messageType || "TEXT",
        direction: message.direction || (message.isMe ? "OUTBOUND" : "INBOUND"),
        status: message.status || "DELIVERED",
        isFromBot: message.isFromBot || false,
        isMe: message.isMe || false,
        botFlowId: message.botFlowId,
        createdAt:
          typeof message.createdAt === "number"
            ? new Date(message.createdAt * 1000).toISOString()
            : message.createdAt ||
              message.timestamp ||
              new Date().toISOString(),
        updatedAt:
          typeof message.updatedAt === "number"
            ? new Date(message.updatedAt * 1000).toISOString()
            : message.updatedAt ||
              message.timestamp ||
              new Date().toISOString(),
        // NOVO: Incluir metadata da mensagem
        metadata: message.metadata
          ? typeof message.metadata === "string"
            ? JSON.parse(message.metadata)
            : message.metadata
          : undefined,
      };

      console.log(
        "🎫 handleNewMessage: Mensagem processada:",
        processedMessage
      );

      // ✅ ADICIONAR LOG PRE-CHAMADA
      console.log("🎫 handleNewMessage: Chamando addMessage...");
      console.log(
        "🎫 handleNewMessage: Mensagens antes da chamada:",
        useSelectedTicket.getState().messages.length
      );

      // ✅ USAR addMessage DIRETAMENTE (evita duplicação)
      useSelectedTicket.getState().addMessage(processedMessage);

      // ✅ ADICIONAR LOG PÓS-CHAMADA
      console.log(
        "🎫 handleNewMessage: Mensagens após a chamada:",
        useSelectedTicket.getState().messages.length
      );
      console.log(
        "✅ handleNewMessage: Mensagem adicionada ao chat do ticket selecionado"
      );
    } else {
      console.log(
        "🎫 handleNewMessage: Mensagem não é do ticket selecionado, ignorando para o chat"
      );
    }
  },

  handleTicketUpdate: (ticketId, updates) => {
    // Atualizar ticket na lista principal
    get().updateTicketInList(ticketId, updates);

    // Se for o ticket selecionado, atualizar também
    const selectedTicket = useSelectedTicket.getState().selectedTicket;
    if (selectedTicket && selectedTicket.id === ticketId) {
      useSelectedTicket.getState().updateSelectedTicket(updates);
    }

    console.log("🎫 Ticket atualizado em tempo real:", ticketId, updates);
  },

  handleNewTicket: (newTicketData) => {
    const executionId = Math.random().toString(36).substr(2, 9);
    console.log("🆕 handleNewTicket: INÍCIO da execução:", executionId);
    console.log("🆕 handleNewTicket: Timestamp:", new Date().toISOString());
    console.log("🆕 handleNewTicket: Dados recebidos:", newTicketData);

    const { ticket, action } = newTicketData;

    console.log("🆕 handleNewTicket: Ticket extraído:", ticket);
    console.log("🆕 handleNewTicket: Action extraída:", action);

    if (action === "created" && ticket) {
      // Verificar se o ticket tem os campos necessários para ordenação
      if (!ticket.lastMessageAt) {
        console.warn(
          "⚠️ handleNewTicket: Ticket sem lastMessageAt, usando createdAt ou agora"
        );
        ticket.lastMessageAt = ticket.createdAt || new Date().toISOString();
      }

      console.log(
        "🆕 handleNewTicket: Ticket com lastMessageAt final:",
        ticket.lastMessageAt
      );

      // Adicionar o novo ticket e reordenar por lastMessageAt (mais recente primeiro)
      set((state) => {
        const newTickets = [ticket, ...state.tickets];

        console.log(
          "🆕 handleNewTicket: Total de tickets antes:",
          state.tickets.length
        );
        console.log(
          "🆕 handleNewTicket: Total de tickets depois:",
          newTickets.length
        );

        const sortedTickets = sortTicketsByActivity(newTickets);

        console.log(
          "🆕 handleNewTicket: Tickets ordenados:",
          sortedTickets.map((t) => ({
            id: t.id.slice(-8),
            contact: t.contact.name,
            lastMessageAt: t.lastMessageAt,
          }))
        );

        return {
          tickets: sortedTickets,
          totalTickets: state.totalTickets + 1,
        };
      });

      console.log(
        "✅ handleNewTicket: Novo ticket adicionado e lista reordenada:",
        ticket.id
      );
    }
  },
}));

// Store para ticket selecionado e suas mensagens
export const useSelectedTicket = create<
  SelectedTicketState & SelectedTicketActions
>((set, get) => ({
  // Estado inicial
  selectedTicket: null,
  messages: [],
  loadingMessages: false,
  sendingMessage: false,

  // Ações
  selectTicket: async (ticket) => {
    console.log("🎫 selectTicket chamado com:", ticket);

    // 🔥 VERIFICAÇÕES DE SEGURANÇA
    if (!ticket) {
      console.error("❌ Ticket não fornecido para selectTicket");
      return;
    }

    if (!ticket.id) {
      console.error("❌ Ticket sem ID:", ticket);
      return;
    }

    set({ selectedTicket: ticket, messages: [], loadingMessages: true });

    try {
      console.log("📡 Carregando mensagens para ticket:", ticket.id);

      // Carregar mensagens da API real
      const messages = await api.tickets.getMessages(ticket.id);
      console.log("📨 Mensagens recebidas da API:", messages);

      // Mapear mensagens para o formato do store
      const mappedMessages: TicketMessage[] = messages.map((msg: any) => {
        return {
          id: msg.id,
          ticketId: ticket.id,
          contactId: msg.contact?.id || ticket.contact?.id || "",
          content: msg.content,
          messageType: msg.messageType,
          direction: msg.direction,
          status: msg.status,
          isFromBot: msg.isFromBot,
          isMe: msg.isMe || false, // Usar isMe do backend
          botFlowId: msg.botFlowId,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          // Mapear dados de mídia se existirem
          mediaId: msg.mediaId,
          mediaUrl: msg.mediaUrl,
          mediaFileName: msg.mediaFileName,
          mediaFileSize: msg.mediaFileSize,
          mediaMimeType: msg.mediaMimeType,
          mediaThumbnailUrl: msg.mediaThumbnailUrl,
          // NOVO: Mapear metadata com dados de mídia em base64
          metadata: msg.metadata
            ? typeof msg.metadata === "string"
              ? JSON.parse(msg.metadata)
              : msg.metadata
            : undefined,
        };
      });

      console.log("✅ Mensagens mapeadas:", mappedMessages);

      set({
        messages: mappedMessages,
        loadingMessages: false,
      });

      // Entrar no room do ticket para receber mensagens em tempo real
      socketManager.joinTicket(ticket.id);
      console.log(
        `✅ Entrando no room do ticket ${ticket.id} para receber mensagens em tempo real`
      );
    } catch (error) {
      console.error("❌ Erro ao carregar mensagens:", error);
      console.error("❌ Detalhes do erro:", {
        message: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
        ticketId: ticket.id,
      });
      set({ loadingMessages: false });

      // Re-throw para que o componente possa capturar se necessário
      throw error;
    }
  },

  clearSelection: () => {
    const { selectedTicket } = get();

    // Sair do room do ticket se houver um selecionado
    if (selectedTicket) {
      socketManager.leaveTicket(selectedTicket.id);
      console.log(`✅ Saindo do room do ticket ${selectedTicket.id}`);
    }

    set({
      selectedTicket: null,
      messages: [],
      loadingMessages: false,
      sendingMessage: false,
    });
  },

  sendMessage: async (data) => {
    const { selectedTicket } = get();
    if (!selectedTicket) {
      throw new Error("Nenhum ticket selecionado");
    }

    set({ sendingMessage: true });
    try {
      const messageType = data.messageType || "TEXT";

      // Enviar mensagem (com ou sem arquivo)
      console.log("� Enviando mensagem...", {
        hasFile: !!data.file,
        messageType,
        fileName: data.file?.name,
      });

      const response = await api.tickets.sendMessage(
        data.ticketId,
        {
          content: data.content,
          messageType: messageType,
        },
        data.file // Passar o arquivo se existir
      );

      console.log("✅ Mensagem enviada com sucesso:", response);

      // Criar objeto da mensagem para adicionar ao estado local
      const newMessage: TicketMessage = {
        id: response.id,
        ticketId: data.ticketId,
        contactId: selectedTicket.contact.id,
        content: data.content || `Arquivo enviado: ${data.file?.name || ""}`,
        messageType: messageType,
        direction: "OUTBOUND",
        status: "SENT",
        isFromBot: false,
        isMe: true, // Mensagens enviadas são sempre minhas
        createdAt: Date.now().toString(),
        updatedAt: Date.now().toString(),
      };

      // Adicionar mensagem à lista local
      set((state) => ({
        messages: [...state.messages, newMessage],
        sendingMessage: false,
      }));

      // Atualizar lastMessageAt do ticket na lista principal
      useTickets.getState().updateTicketInList(data.ticketId, {
        lastMessageAt: newMessage.createdAt,
        status: "IN_PROGRESS",
      });
    } catch (error: any) {
      console.error("❌ Erro ao enviar mensagem:", error);
      set({ sendingMessage: false });
      throw error;
    }
  },

  reopenTicket: async (ticketId, reason = "Reaberto pelo atendente") => {
    try {
      // Chamar API real
      await api.tickets.reopen(ticketId, reason);

      console.log(`✅ Ticket selecionado ${ticketId} reaberto com sucesso`);

      // Atualizar ticket selecionado
      set((state) => ({
        selectedTicket: state.selectedTicket
          ? { ...state.selectedTicket, status: "OPEN", closedAt: undefined }
          : null,
      }));

      // Atualizar na lista principal também
      useTickets.getState().updateTicketInList(ticketId, {
        status: "OPEN",
        closedAt: undefined,
      });
    } catch (error: any) {
      console.error("❌ Erro ao reabrir ticket:", error);
      throw error;
    }
  },

  closeTicket: async (ticketId, reason = "Encerrado pelo atendente") => {
    try {
      // Chamar API real
      await api.tickets.close(ticketId, reason);

      console.log(`✅ Ticket ${ticketId} fechado com sucesso`);

      const now = new Date().toISOString();

      // Atualizar ticket selecionado
      set((state) => ({
        selectedTicket: state.selectedTicket
          ? { ...state.selectedTicket, status: "CLOSED", closedAt: now }
          : null,
      }));

      // Atualizar na lista principal também
      useTickets.getState().updateTicketInList(ticketId, {
        status: "CLOSED",
        closedAt: now,
      });
    } catch (error: any) {
      console.error("❌ Erro ao fechar ticket:", error);
      throw error;
    }
  },

  loadMessages: async (ticketId) => {
    set({ loadingMessages: true });
    try {
      // Carregar mensagens da API real
      const messages = await api.tickets.getMessages(ticketId);

      // Mapear mensagens para o formato do store
      const mappedMessages: TicketMessage[] = messages.map((msg: any) => ({
        id: msg.id,
        ticketId: ticketId,
        contactId: msg.contact?.id || "",
        content: msg.content,
        messageType: msg.messageType,
        direction: msg.direction,
        status: msg.status,
        isFromBot: msg.isFromBot,
        isMe: msg.isMe || false, // Usar isMe do backend
        botFlowId: msg.botFlowId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        // Mapear dados de mídia se existirem
        mediaId: msg.mediaId,
        mediaUrl: msg.mediaUrl,
        mediaFileName: msg.mediaFileName,
        mediaFileSize: msg.mediaFileSize,
        mediaMimeType: msg.mediaMimeType,
        mediaThumbnailUrl: msg.mediaThumbnailUrl,
        // NOVO: Mapear metadata com dados de mídia em base64
        metadata: msg.metadata
          ? typeof msg.metadata === "string"
            ? JSON.parse(msg.metadata)
            : msg.metadata
          : undefined,
      }));

      console.log(
        `✅ Carregadas ${mappedMessages.length} mensagens para o ticket ${ticketId}`
      );

      set({
        messages: mappedMessages,
        loadingMessages: false,
      });
    } catch (error) {
      console.error("❌ Erro ao carregar mensagens:", error);
      set({ loadingMessages: false });
    }
  },

  // Funções para integração com tempo real
  addMessage: (message) => {
    console.log("📝 addMessage: Tentando adicionar mensagem:", message);
    console.log(
      "📝 addMessage: Estado atual - total de mensagens:",
      get().messages.length
    );

    // ✅ VALIDAÇÃO: Verificar se a mensagem tem ID válido
    if (!message.id || message.id === `temp_${Date.now()}`) {
      console.warn("⚠️ addMessage: Mensagem sem ID válido, gerando novo ID");
      message.id = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    }

    // ✅ NOVA ABORDAGEM: Usar o mesmo padrão do sendMessage
    const currentMessages = get().messages;

    // Verificar se a mensagem já existe para evitar duplicatas
    const messageExists = currentMessages.some((m) => m.id === message.id);
    if (messageExists) {
      console.log("📝 addMessage: Mensagem já existe, ignorando");
      console.log("📝 addMessage: ID da mensagem duplicada:", message.id);
      return;
    }

    // Adicionar mensagem e ordenar por data
    const updatedMessages = [...currentMessages, message].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    console.log(
      "📝 addMessage: Mensagem será adicionada, total de mensagens:",
      updatedMessages.length
    );
    console.log("📝 addMessage: Nova mensagem adicionada:", {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
    });

    set((state) => ({
      messages: [...state.messages, message],
      sendingMessage: false,
    }));

    // Log após set()
    console.log(
      "📝 addMessage: Estado após set() - total de mensagens:",
      get().messages.length
    );
    console.log(
      `✅ addMessage: Mensagem ${message.id} adicionada ao chat do ticket`
    );
  },

  updateSelectedTicket: (updates) => {
    set((state) => ({
      selectedTicket: state.selectedTicket
        ? { ...state.selectedTicket, ...updates }
        : null,
    }));
  },
}));

// Alias para compatibilidade
export const useTicketStore = useTickets;
