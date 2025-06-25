import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private readonly url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  }

  /**
   * Conecta ao servidor Socket.IO com autenticação
   */
  connect(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        // Se já está tentando conectar, aguarda
        const checkConnection = () => {
          if (this.socket?.connected) {
            resolve(this.socket);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;

      this.socket = io(this.url, {
        auth: {
          token: token,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Eventos de conexão
      this.socket.on("connect", () => {
        console.log("✅ Conectado ao servidor Socket.IO:", this.socket?.id);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Erro de conexão Socket.IO:", error);
        this.isConnecting = false;

        if (error.message === "Authentication error") {
          reject(new Error("Token de autenticação inválido"));
        } else {
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error("Falha ao conectar após múltiplas tentativas"));
          }
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("⚠️ Desconectado do Socket.IO:", reason);
        this.isConnecting = false;
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(
          "🔄 Reconectado ao Socket.IO após",
          attemptNumber,
          "tentativas"
        );
        this.reconnectAttempts = 0;
      });

      this.socket.on("reconnect_error", (error) => {
        console.error("❌ Erro na reconexão:", error);
      });

      this.socket.on("reconnect_failed", () => {
        console.error(
          "❌ Falha na reconexão após",
          this.maxReconnectAttempts,
          "tentativas"
        );
      });
    });
  }

  /**
   * Desconecta do servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtém a instância do socket
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Entra em uma sala de sessão
   */
  joinSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("joinSession", sessionId);
      console.log("📱 Entrou na sessão:", sessionId);
    }
  }

  /**
   * Sai de uma sala de sessão
   */
  leaveSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("leaveSession", sessionId);
      console.log("📱 Saiu da sessão:", sessionId);
    }
  }

  /**
   * Entra em uma sala de ticket
   */
  joinTicket(ticketId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("joinTicket", ticketId);
      console.log("🎫 Entrou no ticket:", ticketId);
    }
  }

  /**
   * Sai de uma sala de ticket
   */
  leaveTicket(ticketId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("leaveTicket", ticketId);
      console.log("🎫 Saiu do ticket:", ticketId);
    }
  }

  /**
   * Registra listener para eventos
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove listener de eventos
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emite um evento
   */
  emit(event: string, ...args: any[]): void {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn("⚠️ Socket não conectado. Evento ignorado:", event);
    }
  }
}

// Instância singleton
export const socketService = new SocketService();
export default socketService;
