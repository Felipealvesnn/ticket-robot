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

      this.socket!.on("disconnect", (reason) => {
        console.log("⚠️ Desconectado:", reason);

        // Log detalhado do motivo da desconexão
        console.log("🔍 Detalhes da desconexão:", {
          reason,
          connected: this.socket?.connected,
          active: this.socket?.active,
          id: this.socket?.id,
        });

        // Se a reconexão automática está ativa, deixar o Socket.IO cuidar
        if (this.socket!.active) {
          console.log("🔄 Reconexão automática em curso...");
          return;
        }

        // Para desconexões manuais ou forçadas pelo servidor, tentar reconectar
        if (reason === "io server disconnect" || reason === "transport close") {
          console.log("🔄 Tentando reconexão manual devido a:", reason);
          setTimeout(() => {
            if (this.socket && !this.socket.connected) {
              this.socket.connect();
            }
          }, 2000); // Aguardar 2 segundos antes de tentar reconectar
        }
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
      this.socket.emit("join-session", { sessionId });
      console.log("📱 Entrou na sessão:", sessionId);
    }
  }

  /**
   * Sai de uma sala de sessão
   */
  leaveSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("leave-session", { sessionId });
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

  /**
   * Força reconexão do socket
   */
  forceReconnect(): void {
    console.log("🔄 Forçando reconexão do socket...");

    if (this.socket) {
      this.socket.disconnect();
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, 1000);
    }
  }

  /**
   * Verifica a saúde da conexão e reconecta se necessário
   */
  checkHealth(): boolean {
    const isConnected = this.isConnected();
    const hasSocket = !!this.socket;

    console.log("🏥 Verificação de saúde do socket:", {
      hasSocket,
      isConnected,
      socketId: this.socket?.id,
      active: this.socket?.active,
    });

    // Se não está conectado mas tem socket, tentar reconectar
    if (hasSocket && !isConnected && !this.isConnecting) {
      console.log(
        "🔄 Socket detectado como desconectado, tentando reconectar..."
      );
      this.forceReconnect();
      return false;
    }

    return isConnected;
  }

  /**
   * Inicia monitoramento periódico da conexão
   */
  startHealthMonitoring(intervalMs: number = 10000): void {
    // Limpar intervalo anterior se existir
    if ((this as any).healthInterval) {
      clearInterval((this as any).healthInterval);
    }

    (this as any).healthInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);

    console.log(`🩺 Monitoramento de saúde iniciado (${intervalMs}ms)`);
  }

  /**
   * Para o monitoramento de saúde
   */
  stopHealthMonitoring(): void {
    if ((this as any).healthInterval) {
      clearInterval((this as any).healthInterval);
      (this as any).healthInterval = null;
      console.log("🛑 Monitoramento de saúde parado");
    }
  }
}

// Instância singleton
export const socketService = new SocketService();
export default socketService;
