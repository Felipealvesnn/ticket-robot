import { socketService } from "@/services/socket";
import { useAuthStore } from "@/store/auth";
import { useCallback, useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Hook personalizado para gerenciar conexão Socket.IO
 */
export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  const connect = useCallback(async () => {
    try {
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      const connectedSocket = await socketService.connect(token);
      setSocket(connectedSocket);
      setIsConnected(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      console.error("Erro ao conectar socket:", err);
    }
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setSocket(null);
    setIsConnected(false);
    setError(null);
  }, []);

  // Conecta automaticamente quando autenticado
  useEffect(() => {
    if (isAuthenticated && !isConnected && !error) {
      connect();
    }
  }, [isAuthenticated, isConnected, error, connect]);

  // Desconecta quando não autenticado
  useEffect(() => {
    if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, isConnected, disconnect]);

  // Monitora o estado da conexão
  useEffect(() => {
    const currentSocket = socketService.getSocket();

    if (currentSocket) {
      const handleConnect = () => {
        setIsConnected(true);
        setError(null);
      };

      const handleDisconnect = () => {
        setIsConnected(false);
      };

      const handleConnectError = (err: Error) => {
        setError(err.message);
        setIsConnected(false);
      };

      currentSocket.on("connect", handleConnect);
      currentSocket.on("disconnect", handleDisconnect);
      currentSocket.on("connect_error", handleConnectError);

      // Cleanup
      return () => {
        currentSocket.off("connect", handleConnect);
        currentSocket.off("disconnect", handleDisconnect);
        currentSocket.off("connect_error", handleConnectError);
      };
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    error,
    connect,
    disconnect,
  };
};

/**
 * Hook para escutar eventos específicos do Socket.IO
 */
export const useSocketEvent = <T = any>(
  event: string,
  callback: (data: T) => void,
  deps: React.DependencyList = []
) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected) {
      socket.on(event, callback);

      return () => {
        socket.off(event, callback);
      };
    }
  }, [socket, isConnected, event, ...deps]);
};

/**
 * Hook para emitir eventos do Socket.IO
 */
export const useSocketEmit = () => {
  const { socket, isConnected } = useSocket();

  const emit = useCallback(
    (event: string, ...args: any[]) => {
      if (socket && isConnected) {
        socket.emit(event, ...args);
        return true;
      }
      console.warn("Socket não conectado. Evento não enviado:", event);
      return false;
    },
    [socket, isConnected]
  );

  return { emit, isConnected };
};
