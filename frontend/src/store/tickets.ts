"use client";

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
  botFlowId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketFilters {
  status?: "ALL" | "OPEN" | "CLOSED";
  priority?: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  search?: string;
  sessionId?: string;
  assignedTo?: string;
}

interface TicketsState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  totalTickets: number;
  filters: TicketFilters;
}

interface TicketsActions {
  setFilters: (filters: Partial<TicketFilters>) => void;
  loadTickets: () => Promise<void>;
  reopenTicket: (ticketId: string, reason?: string) => Promise<void>;
  addMessageToTicket: (ticketId: string, message: TicketMessage) => void;
  updateTicketInList: (ticketId: string, updates: Partial<Ticket>) => void;
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
    messageType: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  }) => Promise<void>;
  reopenTicket: (ticketId: string, reason?: string) => Promise<void>;
  closeTicket: (ticketId: string, reason?: string) => Promise<void>;
  loadMessages: (ticketId: string) => Promise<void>;
}

// Store principal de tickets
export const useTickets = create<TicketsState & TicketsActions>((set, get) => ({
  // Estado inicial
  tickets: [],
  loading: false,
  error: null,
  totalTickets: 0,
  filters: {},

  // Ações
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  loadTickets: async () => {
    set({ loading: true, error: null });
    try {
      // TODO: Implementar API real
      // const response = await api.tickets.getAll();

      // Por enquanto, usar dados mock
      const mockTickets: Ticket[] = [
        {
          id: "ticket-1",
          status: "OPEN",
          priority: "HIGH",
          subject: "Dúvida sobre produto",
          contact: {
            id: "contact-1",
            name: "João Silva",
            phoneNumber: "+55 11 99999-1111",
            companyId: "company-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          messagingSession: {
            id: "session-1",
            name: "WhatsApp Principal",
            platform: "WHATSAPP",
            status: "CONNECTED",
            companyId: "company-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          companyId: "company-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          isFromBot: false,
        },
        {
          id: "ticket-2",
          status: "CLOSED",
          priority: "MEDIUM",
          subject: "Suporte técnico",
          contact: {
            id: "contact-2",
            name: "Maria Santos",
            phoneNumber: "+55 11 99999-2222",
            companyId: "company-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          messagingSession: {
            id: "session-1",
            name: "WhatsApp Principal",
            platform: "WHATSAPP",
            status: "CONNECTED",
            companyId: "company-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          companyId: "company-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          closedAt: new Date().toISOString(),
          isFromBot: false,
        },
      ];

      set({
        tickets: mockTickets,
        totalTickets: mockTickets.length,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao carregar tickets",
        loading: false,
      });
    }
  },

  reopenTicket: async (ticketId, reason = "Reaberto pelo atendente") => {
    try {
      // TODO: Implementar API real
      // await api.tickets.reopen(ticketId, { reason });

      console.log(`Reabrindo ticket ${ticketId}: ${reason}`);

      // Atualizar ticket na lista
      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: "OPEN" as const, closedAt: undefined }
            : ticket
        ),
      }));
    } catch (error: any) {
      console.error("Erro ao reabrir ticket:", error);
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
      // TODO: Implementar API real
      // const response = await api.tickets.getMessages(ticket.id);

      // Por enquanto, usar dados mock
      const mockMessages: TicketMessage[] = [];

      set({
        messages: mockMessages,
        loadingMessages: false,
      });
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      set({ loadingMessages: false });
    }
  },

  clearSelection: () => {
    set({
      selectedTicket: null,
      messages: [],
      loadingMessages: false,
      sendingMessage: false,
    });
  },

  sendMessage: async (data) => {
    set({ sendingMessage: true });
    try {
      // TODO: Implementar API real
      // const response = await api.tickets.sendMessage(data.ticketId, data);

      console.log("Enviando mensagem:", data);

      // Adicionar mensagem enviada à lista
      const newMessage: TicketMessage = {
        id: `temp_${Date.now()}`,
        ticketId: data.ticketId,
        contactId: "",
        content: data.content,
        messageType: data.messageType,
        direction: "OUTBOUND",
        status: "SENT",
        isFromBot: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

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
      console.error("Erro ao enviar mensagem:", error);
      set({ sendingMessage: false });
      throw error;
    }
  },

  reopenTicket: async (ticketId, reason = "Reaberto pelo atendente") => {
    try {
      // TODO: Implementar API real
      // await api.tickets.reopen(ticketId, { reason });

      console.log(`Reabrindo ticket selecionado ${ticketId}: ${reason}`);

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
      console.error("Erro ao reabrir ticket:", error);
      throw error;
    }
  },

  closeTicket: async (ticketId, reason = "Encerrado pelo atendente") => {
    try {
      // TODO: Implementar API real
      // await api.tickets.close(ticketId, { reason });

      console.log(`Fechando ticket ${ticketId}: ${reason}`);

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
      console.error("Erro ao fechar ticket:", error);
      throw error;
    }
  },

  loadMessages: async (ticketId) => {
    set({ loadingMessages: true });
    try {
      // TODO: Implementar API real
      // const response = await api.tickets.getMessages(ticketId);

      console.log("Carregando mensagens para ticket:", ticketId);

      set({
        messages: [],
        loadingMessages: false,
      });
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      set({ loadingMessages: false });
    }
  },
}));

// Alias para compatibilidade
export const useTicketStore = useTickets;
