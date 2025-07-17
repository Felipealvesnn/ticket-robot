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

export interface NewTicket {
  ticket: any;
  action: string;
  sessionId?: string;
  companyId?: string;
}

export interface SocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: string) => void;
  onMessage?: (message: SocketMessage) => void;
  onSessionStatus?: (status: SessionStatus) => void;
  onTicketUpdate?: (update: TicketUpdate) => void;
  onNewTicket?: (newTicket: NewTicket) => void;
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
   * Evita múltiplas conexões e callbacks duplicados
   */
  async connect(token: string, callbacks: SocketCallbacks = {}): Promise<void> {
    if (this.socket?.connected) {
      console.log("🔌 Socket já conectado, apenas atualizando callbacks");
      // ✅ SUBSTITUIR callbacks em vez de acumular
      this.addCallbacks(callbacks);
      callbacks.onConnect?.();
      return;
    }

    if (this.isConnecting) {
      console.log("🔌 Socket já está conectando, aguardando...");
      // ✅ NÃO adicionar callbacks durante conexão para evitar duplicatas
      return;
    }

    // ✅ LIMPAR callbacks antigos antes de adicionar novos
    this.callbacks = {};
    this.addCallbacks(callbacks);
    this.isConnecting = true;

    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    console.log("🔌 Iniciando conexão Socket.IO...");
    console.log("  - URL:", url);
    console.log("  - Token presente:", !!token);
    console.log("  - Socket existe?", !!this.socket);

    this.socket = io(url, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 15000, // Timeout para cada tentativa
    });

    console.log("🔌 Socket criado, configurando eventos...");
    this.setupEvents();

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.isConnecting = false;
        reject(new Error("Falha ao criar socket"));
        return;
      }

      let resolved = false; // � Flag para evitar múltiplas resoluções

      // 🔧 Timeout melhorado com flag de controle
      const connectTimeout = setTimeout(() => {
        if (!resolved) {
          console.log("⏰ Timeout acionado - conexão não estabelecida em 15s");
          resolved = true;
          this.isConnecting = false;
          reject(
            new Error(
              `Timeout na conexão (15s) - Verifique se o backend está rodando em ${url}`
            )
          );
        }
      }, 15000);

      this.socket.on("connect", () => {
        if (!resolved) {
          console.log("✅ Socket conectado antes do timeout:", this.socket?.id);
          resolved = true;
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.callbacks.onConnect?.();
          resolve();
        } else {
          console.log("⚠️ Evento connect ignorado - já resolvido");
        }
      });

      this.socket.on("connect_error", (error: any) => {
        if (!resolved) {
          console.error("❌ Erro de conexão detalhado:");
          console.error("  - Tipo:", error.type || "Desconhecido");
          console.error("  - Descrição:", error.description || error.message);
          console.error("  - Contexto:", error.context || "N/A");
          console.error("  - Mensagem:", error.message);
          console.error("  - URL tentada:", url);

          resolved = true;
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.reconnectAttempts++;

          const friendlyError = this.getFriendlyErrorMessage(error);
          this.callbacks.onError?.(friendlyError);
          reject(new Error(friendlyError));
        } else {
          console.log("⚠️ Erro de conexão ignorado - já resolvido");
        }
      });
    });
  }

  /**
   * ⚙️ CONFIGURA TODOS OS EVENTOS DO SOCKET
   */
  private setupEvents() {
    if (!this.socket) return;

    console.log("⚙️ Configurando eventos do socket...");

    // Eventos de conexão
    this.socket.on("connect", () => {
      console.log("🎉 [EVENTO] Socket conectado! ID:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 [EVENTO] Socket desconectado:", reason);
      this.callbacks.onDisconnect?.(reason);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(
        "🔄 [EVENTO] Socket reconectado (tentativa:",
        attemptNumber,
        ")"
      );
      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("❌ [EVENTO] Erro de reconexão:", error);
      this.callbacks.onError?.(error.message);
    });

    this.socket.on("reconnect_failed", () => {
      console.error(
        "❌ [EVENTO] Falha ao reconectar após",
        this.maxReconnectAttempts,
        "tentativas"
      );
      this.callbacks.onError?.("Falha na reconexão");
    });

    // Log de todos os eventos para debug
    this.socket.onAny((eventName, ...args) => {
      console.log(`📡 [EVENTO] ${eventName}:`, args);
    });

    // Eventos de negócio
    this.socket.on("new-message", (data) => {
      console.log("📨 Evento 'new-message' recebido:", data);
      const message = this.processMessage(data);
      console.log("💬 Mensagem processada:", message);
      console.log("🔍 Callback onMessage existe?", !!this.callbacks.onMessage);

      if (this.callbacks.onMessage) {
        console.log("📞 Chamando callback onMessage...");
        this.callbacks.onMessage(message);
        console.log("✅ Callback onMessage executado");
      } else {
        console.warn("⚠️ Nenhum callback onMessage registrado!");
      }
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

    this.socket.on("new-ticket", (data) => {
      console.log("🆕 Novo ticket recebido:", data);
      this.callbacks.onNewTicket?.(data);
    });
  }

  /**
   * 🔄 PROCESSA MENSAGEM E DETERMINA SE É PRÓPRIA
   */
  private processMessage(data: any): SocketMessage {
    console.log("🔄 processMessage: Dados recebidos:", data);

    const message = data.message || data;
    console.log("🔄 processMessage: Mensagem extraída:", message);

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

    const processedMessage: SocketMessage = {
      id: message.id || `temp_${Date.now()}`,
      ticketId: message.ticketId || data.ticketId,
      sessionId: message.sessionId || data.sessionId,
      contactId: message.contactId || "",
      content: message.content || message.body || "",
      messageType: message.messageType || "TEXT",
      direction: (isMe ? "OUTBOUND" : "INBOUND") as "INBOUND" | "OUTBOUND",
      status: message.status || "DELIVERED",
      isFromBot: message.isFromBot || false,
      isMe,
      createdAt:
        message.createdAt || message.timestamp || new Date().toISOString(),
      from: message.from,
      to: message.to,
    };

    console.log("🔄 processMessage: Mensagem processada:", processedMessage);
    return processedMessage;
  }

  /**
   * 🔌 DESCONECTA E LIMPA CALLBACKS
   */
  disconnect() {
    if (this.socket) {
      console.log("🔌 Desconectando socket...");
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    // ✅ LIMPAR callbacks ao desconectar
    this.callbacks = {};
    console.log("🧹 Callbacks limpos após desconexão");
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
   * ✅ SUBSTITUI CALLBACKS (NÃO ACUMULA)
   * A lógica antiga estava acumulando callbacks, causando múltiplas execuções
   */
  private addCallbacks(newCallbacks: SocketCallbacks) {
    // ✅ SUBSTITUIR em vez de acumular
    Object.entries(newCallbacks).forEach(([event, callback]) => {
      if (callback) {
        console.log(`🔄 Substituindo callback para: ${event}`);
        this.callbacks[event as keyof SocketCallbacks] = callback;
      }
    });
  }

  /**
   * 🔍 DEBUG: Verificar callbacks registrados
   */
  debugCallbacks() {
    console.log("🔍 Callbacks registrados:");
    console.log("  - onConnect:", !!this.callbacks.onConnect);
    console.log("  - onDisconnect:", !!this.callbacks.onDisconnect);
    console.log("  - onError:", !!this.callbacks.onError);
    console.log("  - onMessage:", !!this.callbacks.onMessage);
    console.log("  - onSessionStatus:", !!this.callbacks.onSessionStatus);
    console.log("  - onTicketUpdate:", !!this.callbacks.onTicketUpdate);
    return this.callbacks;
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
      callbacksCount: Object.keys(this.callbacks).length,
      callbacks: {
        onConnect: !!this.callbacks.onConnect,
        onDisconnect: !!this.callbacks.onDisconnect,
        onError: !!this.callbacks.onError,
        onMessage: !!this.callbacks.onMessage,
        onSessionStatus: !!this.callbacks.onSessionStatus,
        onTicketUpdate: !!this.callbacks.onTicketUpdate,
      },
    };
  }

  /**
   * 🔧 RESETAR COMPLETAMENTE O SOCKET MANAGER
   * Útil para debug e testes
   */
  reset() {
    console.log("🔄 RESETANDO SocketManager completamente...");
    this.disconnect();
    this.callbacks = {};
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    console.log("✅ SocketManager resetado");
  }

  /**
   * 🔧 CONVERTE ERROS TÉCNICOS EM MENSAGENS AMIGÁVEIS
   */
  private getFriendlyErrorMessage(error: any): string {
    const errorMessage = error.message || error.toString();

    // Mapear erros comuns para mensagens amigáveis
    if (errorMessage.includes("ECONNREFUSED")) {
      return "Servidor não está respondendo. Verifique se o backend está rodando.";
    }

    if (errorMessage.includes("timeout")) {
      return "Conexão demorou muito para responder. Verifique sua internet.";
    }

    if (errorMessage.includes("ENOTFOUND")) {
      return "Servidor não encontrado. Verifique a URL de conexão.";
    }

    if (errorMessage.includes("auth")) {
      return "Erro de autenticação. Token pode estar inválido.";
    }

    if (errorMessage.includes("CORS")) {
      return "Erro de CORS. Verifique as configurações do servidor.";
    }

    // Retornar mensagem original se não conseguir mapear
    return `Erro de conexão: ${errorMessage}`;
  }

  /**
   * 🧪 TESTAR CONEXÃO COM O SERVIDOR
   * Método útil para debug
   */
  async testConnection(token: string): Promise<{
    success: boolean;
    error?: string;
    details: any;
  }> {
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    try {
      console.log("🧪 Testando conexão...");
      console.log("🔍 URL:", url);
      console.log("🔍 Token presente:", !!token);

      // Testar se o servidor responde
      const response = await fetch(`${url}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      });

      if (response.ok) {
        return {
          success: true,
          details: {
            status: response.status,
            statusText: response.statusText,
            url,
            tokenPresent: !!token,
          },
        };
      } else {
        return {
          success: false,
          error: `Servidor respondeu com status ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url,
          },
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.getFriendlyErrorMessage(error),
        details: {
          originalError: error.message,
          url,
          tokenPresent: !!token,
        },
      };
    }
  }
}

// 🌟 INSTÂNCIA SINGLETON - UMA ÚNICA INSTÂNCIA PARA TODO O APP
export const socketManager = new SocketManager();
export default socketManager;
