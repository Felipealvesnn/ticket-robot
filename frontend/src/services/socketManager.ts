"use client";

import { io, Socket } from "socket.io-client";

// Tipos simplificados
export interface SocketMessage {
  id: string;
  ticketId?: string;
  sessionId?: string;
  contactId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  direction: "INBOUND" | "OUTBOUND";
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  isFromBot: boolean;
  isMe: boolean;
  createdAt: string;
  from?: string;
  to?: string;
}

export interface SessionStatus {
  sessionId: string;
  status: "connecting" | "connected" | "disconnected" | "error";
  qrCode?: string;
  error?: string;
}

export interface TicketUpdate {
  ticketId: string;
  status?: string;
  assignedTo?: string;
  lastMessageAt?: string;
  [key: string]: any;
}

// Callbacks que podem ser definidos
export interface SocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: string) => void;
  onMessage?: (message: SocketMessage) => void;
  onSessionStatus?: (status: SessionStatus) => void;
  onTicketUpdate?: (update: TicketUpdate) => void;
}

/**
 * Gerenciador de Socket.IO Unificado
 * Uma única classe que gerencia tudo relacionado ao socket
 */
class SocketManager {
  private socket: Socket | null = null;
  private isConnecting = false;
  private callbacks: SocketCallbacks = {};

  /**
   * Conecta ao servidor
   */
  async connect(token: string, callbacks: SocketCallbacks = {}): Promise<void> {
    if (this.socket?.connected) {
      console.log("🔌 Socket já conectado");
      return;
    }

    if (this.isConnecting) {
      console.log("🔌 Socket já está conectando...");
      return;
    }

    this.callbacks = callbacks;
    this.isConnecting = true;

    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    console.log("🔌 Conectando ao Socket.IO...", url);

    this.socket = io(url, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEvents();

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Falha ao criar socket"));
        return;
      }

      this.socket.on("connect", () => {
        console.log("✅ Socket conectado:", this.socket?.id);
        this.isConnecting = false;
        this.callbacks.onConnect?.();
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Erro de conexão:", error);
        this.isConnecting = false;
        this.callbacks.onError?.(error.message);
        reject(error);
      });
    });
  }

  /**
   * Configura todos os eventos do socket
   */
  private setupEvents() {
    if (!this.socket) return;

    // Eventos de conexão
    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Socket desconectado:", reason);
      this.callbacks.onDisconnect?.(reason);
    });

    this.socket.on("reconnect", () => {
      console.log("🔄 Socket reconectado");
      this.callbacks.onConnect?.();
    });

    // Eventos de negócio
    this.socket.on("new-message", (data) => {
      const message = this.processMessage(data);
      console.log("💬 Nova mensagem:", message);
      this.callbacks.onMessage?.(message);
    });

    this.socket.on("session-status", (data) => {
      console.log("📱 Status de sessão:", data);
      this.callbacks.onSessionStatus?.(data);
    });

    this.socket.on("qr-code", (data) => {
      console.log("📱 QR Code recebido:", data.sessionId);
      this.callbacks.onSessionStatus?.({
        sessionId: data.sessionId,
        status: "connecting",
        qrCode: data.qrCode,
      });
    });

    this.socket.on("ticket-update", (data) => {
      console.log("🎫 Ticket atualizado:", data);
      this.callbacks.onTicketUpdate?.(data);
    });
  }

  /**
   * Processa mensagem recebida e determina se é própria
   */
  private processMessage(data: any): SocketMessage {
    const message = data.message || data;

    // Determinar se é mensagem própria
    let isMe = false;
    if (message.isMe !== undefined) {
      isMe = message.isMe;
    } else if (message.fromMe !== undefined) {
      isMe = message.fromMe;
    } else if (message.direction) {
      isMe = message.direction === "OUTBOUND";
    } else if (message.to?.includes("@c.us")) {
      isMe = true;
    }

    return {
      id: message.id || `temp_${Date.now()}`,
      ticketId: message.ticketId || data.ticketId,
      sessionId: message.sessionId || data.sessionId,
      contactId: message.contactId || "",
      content: message.content || message.body || "",
      messageType: message.messageType || "TEXT",
      direction: isMe ? "OUTBOUND" : "INBOUND",
      status: message.status || "DELIVERED",
      isFromBot: message.isFromBot || false,
      isMe,
      createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
      from: message.from,
      to: message.to,
    };
  }

  /**
   * Desconecta
   */
  disconnect() {
    if (this.socket) {
      console.log("🔌 Desconectando socket...");
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Entra em sala de sessão
   */
  joinSession(sessionId: string) {
    if (this.socket?.connected) {
      this.socket.emit("join-session", { sessionId });
      console.log("📱 Entrou na sessão:", sessionId);
    }
  }

  /**
   * Sai de sala de sessão
   */
  leaveSession(sessionId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave-session", { sessionId });
      console.log("📱 Saiu da sessão:", sessionId);
    }
  }

  /**
   * Entra em sala de ticket
   */
  joinTicket(ticketId: string) {
    if (this.socket?.connected) {
      this.socket.emit("joinTicket", ticketId);
      console.log("🎫 Entrou no ticket:", ticketId);
    }
  }

  /**
   * Sai de sala de ticket
   */
  leaveTicket(ticketId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leaveTicket", ticketId);
      console.log("🎫 Saiu do ticket:", ticketId);
    }
  }

  /**
   * Emite evento
   */
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("⚠️ Socket não conectado. Evento ignorado:", event);
    }
  }
}

// Instância singleton
export const socketManager = new SocketManager();
export default socketManager;
