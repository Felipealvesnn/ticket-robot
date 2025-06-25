"use client";

import { socketService } from "@/services/socket";
import { useAuthStore } from "@/store/auth";
import { useSocketStore } from "@/store/socket";
import React, { createContext, ReactNode, useContext, useEffect } from "react";

interface SocketProviderProps {
  children: ReactNode;
}

const SocketContext = createContext<{}>({});

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const {
    setConnected,
    setError,
    setReconnectAttempts,
    initializeSocket,
    clearState,
  } = useSocketStore();

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("auth_token");

      if (token && !socketService.isConnected()) {
        // Conectar ao socket
        socketService
          .connect(token)
          .then(() => {
            setConnected(true);
            initializeSocket();
            console.log("✅ Socket.IO inicializado no SocketProvider");
          })
          .catch((error) => {
            setError(error.message);
            console.error(
              "❌ Erro ao conectar Socket.IO no SocketProvider:",
              error
            );
          });
      } else if (socketService.isConnected()) {
        // Se já conectado, apenas inicializar os listeners
        initializeSocket();
      }

      // Configurar listeners globais do socket
      const socket = socketService.getSocket();
      if (socket) {
        const handleConnect = () => {
          setConnected(true);
          setError(null);
          setReconnectAttempts(0);
        };

        const handleDisconnect = (reason: string) => {
          setConnected(false);
          console.log("🔌 Socket desconectado:", reason);
        };

        const handleConnectError = (error: Error) => {
          setConnected(false);
          setError(error.message);
          console.error("❌ Erro de conexão socket:", error);
        };

        const handleReconnect = (attemptNumber: number) => {
          setConnected(true);
          setError(null);
          setReconnectAttempts(0);
          console.log(
            "🔄 Socket reconectado após",
            attemptNumber,
            "tentativas"
          );
        };

        const handleReconnectAttempt = (attemptNumber: number) => {
          setReconnectAttempts(attemptNumber);
          console.log("🔄 Tentativa de reconexão:", attemptNumber);
        };

        // Registrar listeners
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("reconnect", handleReconnect);
        socket.on("reconnect_attempt", handleReconnectAttempt);

        // Cleanup
        return () => {
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
          socket.off("connect_error", handleConnectError);
          socket.off("reconnect", handleReconnect);
          socket.off("reconnect_attempt", handleReconnectAttempt);
        };
      }
    } else {
      // Se não autenticado, desconectar e limpar estado
      socketService.disconnect();
      clearState();
    }
  }, [
    isAuthenticated,
    setConnected,
    setError,
    setReconnectAttempts,
    initializeSocket,
    clearState,
  ]);

  return <SocketContext.Provider value={{}}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => {
  return useContext(SocketContext);
};
