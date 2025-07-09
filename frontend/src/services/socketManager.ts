"use client";

import { io, Socket } from "socket.io-client";

// Tipos simplificados e centralizados
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

export interface SocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: string) => void;
  onMessage?: (message: SocketMessage) => void;
  onSessionStatus?: (status: SessionStatus) => void;
  onTicketUpdate?: (update: TicketUpdate) => void;
}

/**
 * 🚀 SOCKET MANAGER UNIFICADO
 * Única classe responsável por TODA comunicação Socket.IO
 * Padrão Singleton para evitar múltiplas conexões
 */
class SocketManager {
  private socket: Socket | null = null;
  private isConnecting = false;
  private callbacks: SocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * ✅ CONECTA AO SERVIDOR (Promise-based)
   */
  async connect(token: string, callbacks: SocketCallbacks = {}): Promise<void> {
    if (this.socket?.connected) {
      console.log("🔌 Socket já conectado");
      callbacks.onConnect?.();
      return;
    }

    if (this.isConnecting) {
      console.log("🔌 Socket já está conectando...");
      return;
    }

    this.callbacks = { ...this.callbacks, ...callbacks };
    this.isConnecting = true;

    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    console.log("🔌 Conectando ao Socket.IO...", url);

    this.socket = io(url, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEvents();

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.isConnecting = false;
        reject(new Error("Falha ao criar socket"));
        return;
      }

      const connectTimeout = setTimeout(() => {
        this.isConnecting = false;
        reject(new Error("Timeout na conexão"));
      }, 10000);

      this.socket.on("connect", () => {
        clearTimeout(connectTimeout);
        console.log("✅ Socket conectado:", this.socket?.id);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.callbacks.onConnect?.();
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        clearTimeout(connectTimeout);
        console.error("❌ Erro de conexão:", error);
        this.isConnecting = false;
        this.reconnectAttempts++;
        this.callbacks.onError?.(error.message);
        reject(error);
      });
    });
  }

  /**
   * ⚙️ CONFIGURA TODOS OS EVENTOS DO SOCKET
   */
  private setupEvents() {
    if (!this.socket) return;

    // Eventos de conexão
    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Socket desconectado:", reason);
      this.callbacks.onDisconnect?.(reason);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconectado (tentativa:", attemptNumber, ")");
      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("❌ Erro de reconexão:", error);
      this.callbacks.onError?.(error.message);
    });

    this.socket.on("reconnect_failed", () => {
      console.error(
        "❌ Falha ao reconectar após",
        this.maxReconnectAttempts,
        "tentativas"
      );
      this.callbacks.onError?.("Falha na reconexão");
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

    this.socket.on("qr-code-image", (data) => {
      console.log("📱 QR Code base64 recebido:", data.sessionId);
      this.callbacks.onSessionStatus?.({
        sessionId: data.sessionId,
        status: "connecting",
        qrCode: data.qrCodeBase64,
      });
    });

    this.socket.on("ticket-update", (data) => {
      console.log("🎫 Ticket atualizado:", data);
      this.callbacks.onTicketUpdate?.(data);
    });
  }

  /**
   * 🔄 PROCESSA MENSAGEM E DETERMINA SE É PRÓPRIA
   */
  private processMessage(data: any): SocketMessage {
    const message = data.message || data;

    // Lógica inteligente para determinar se é mensagem própria
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
      createdAt:
        message.createdAt || message.timestamp || new Date().toISOString(),
      from: message.from,
      to: message.to,
    };
  }

  /**
   * 🔌 DESCONECTA
   */
  disconnect() {
    if (this.socket) {
      console.log("🔌 Desconectando socket...");
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * ✅ VERIFICA SE ESTÁ CONECTADO
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 📱 GERENCIAMENTO DE SESSÕES
   */
  joinSession(sessionId: string) {
    if (this.socket?.connected) {
      this.socket.emit("join-session", { sessionId });
      console.log("📱 Entrou na sessão:", sessionId);
    } else {
      console.warn(
        "⚠️ Socket não conectado. Não foi possível entrar na sessão:",
        sessionId
      );
    }
  }

  leaveSession(sessionId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave-session", { sessionId });
      console.log("📱 Saiu da sessão:", sessionId);
    }
  }

  /**
   * 🎫 GERENCIAMENTO DE TICKETS
   */
  joinTicket(ticketId: string) {
    if (this.socket?.connected) {
      this.socket.emit("joinTicket", ticketId);
      console.log("🎫 Entrou no ticket:", ticketId);
    } else {
      console.warn(
        "⚠️ Socket não conectado. Não foi possível entrar no ticket:",
        ticketId
      );
    }
  }

  leaveTicket(ticketId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leaveTicket", ticketId);
      console.log("🎫 Saiu do ticket:", ticketId);
    }
  }

  /**
   * 📡 EMITIR EVENTOS CUSTOMIZADOS
   */
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      console.log("📡 Evento emitido:", event, data);
    } else {
      console.warn("⚠️ Socket não conectado. Evento ignorado:", event);
    }
  }

  /**
   * 📊 ESTATÍSTICAS E DEBUG
   */
  getStats() {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      hasCallbacks: Object.keys(this.callbacks).length > 0,
    };
  }
}

// 🌟 INSTÂNCIA SINGLETON - UMA ÚNICA INSTÂNCIA PARA TODO O APP
export const socketManager = new SocketManager();
export default socketManager;
