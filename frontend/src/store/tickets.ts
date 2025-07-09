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
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;
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
  addMessageToChat: (message: TicketMessage) => void;
  updateSelectedTicket: (updates: Partial<Ticket>) => void;
}

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
        tickets,
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
        tickets: state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: "OPEN" as const, closedAt: undefined }
            : ticket
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
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, lastMessageAt: message.createdAt }
          : ticket
      ),
    }));
  },

  updateTicketInList: (ticketId, updates) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
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
    // Determinar se é uma mensagem própria (enviada) - PRIORIZAR isMe
    const isOutbound =
      message.isMe === true ||
      message.direction === "OUTBOUND" ||
      message.fromMe === true ||
      (message.from && message.to && message.to.includes("@c.us"));

   

    // Adicionar mensagem ao ticket correspondente se ele estiver selecionado
    const selectedTicket = useSelectedTicket.getState().selectedTicket;
    if (selectedTicket && selectedTicket.id === message.ticketId) {
      const newMessage: TicketMessage = {
        id: message.id || `temp_${Date.now()}`,
        ticketId: message.ticketId,
        contactId: message.contactId || "",
        content: message.content || message.body || "",
        messageType: message.messageType || "TEXT",
        // Garantir que mensagens próprias sejam OUTBOUND
        direction: isOutbound ? "OUTBOUND" : "INBOUND",
        status: message.status || "DELIVERED",
        isFromBot: message.isFromBot || false,
        isMe: message.isMe || isOutbound, // Usar isMe do backend ou determinar pela direção
        botFlowId: message.botFlowId,
        createdAt:
          message.createdAt || message.timestamp || new Date().toISOString(),
        updatedAt:
          message.updatedAt || message.timestamp || new Date().toISOString(),
      };

      console.log("✅ Adicionando mensagem ao ticket selecionado:", newMessage);
      useSelectedTicket.getState().addMessage(newMessage);
    }

    // Atualizar lastMessageAt do ticket na lista
    get().updateTicketInList(message.ticketId, {
      lastMessageAt: message.createdAt || new Date().toISOString(),
    });

    console.log("📱 Nova mensagem recebida em tempo real:", message);
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

  initializeSocketListeners: () => {
    // NOTA: Agora usamos o hook useSocket() em vez de listeners no store
    // Esta função pode ser removida após migração completa
    console.warn("⚠️ initializeSocketListeners está deprecated. Use useSocket() hook.");
  },

  cleanupSocketListeners: () => {
    // NOTA: Agora usamos o hook useSocket() em vez de listeners no store
    // Esta função pode ser removida após migração completa
    console.warn("⚠️ cleanupSocketListeners está deprecated. Use useSocket() hook.");
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
    set({ selectedTicket: ticket, messages: [], loadingMessages: true });

    try {
      // Carregar mensagens da API real
      const messages = await api.tickets.getMessages(ticket.id);

      // Mapear mensagens para o formato do store
      const mappedMessages: TicketMessage[] = messages.map((msg: any) => ({
        id: msg.id,
        ticketId: ticket.id,
        contactId: msg.contact?.id || ticket.contact.id,
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
      }));

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
      set({ loadingMessages: false });
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
      let response;
      const messageType = data.messageType || "TEXT";

      // Se tem arquivo, é uma mensagem de mídia
      if (data.file) {
        console.log("📎 Enviando mensagem de mídia...");

        // 1. Primeiro fazer upload do arquivo
        const uploadResponse = await api.media.upload(data.file, {
          ticketId: data.ticketId,
          messageType: messageType as "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT",
        });

        console.log("✅ Upload de mídia concluído:", uploadResponse);

        // 2. Enviar mensagem com referência ao arquivo
        // Por enquanto, vamos usar apenas o content e messageType
        // A URL da mídia será recuperada via uploadResponse.url
        response = await api.tickets.sendMessage(data.ticketId, {
          content: data.content || `Arquivo enviado: ${data.file.name}`,
          messageType: messageType,
        });
      } else {
        // Mensagem de texto normal
        response = await api.tickets.sendMessage(data.ticketId, {
          content: data.content,
          messageType: messageType,
        });
      }

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
        createdAt: response.createdAt,
        updatedAt: response.createdAt,
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
    set((state) => {
      // Verificar se a mensagem já existe para evitar duplicatas
      const messageExists = state.messages.some((m) => m.id === message.id);
      if (messageExists) {
        return state;
      }

      // Adicionar mensagem e ordenar por data
      const updatedMessages = [...state.messages, message].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return {
        messages: updatedMessages,
      };
    });
    console.log(`✅ Mensagem ${message.id} adicionada ao chat do ticket`);
  },

  addMessageToChat: (message) => {
    // Usar a mesma lógica da addMessage
    get().addMessage(message);
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
