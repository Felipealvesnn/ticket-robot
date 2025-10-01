"use client";

import { useEffect, useState } from "react";
import { socketManager } from "../services/socketManager";

/**
 * 🔥 HOOK SIMPLES PARA STATUS DO SOCKET
 * Substitui useSocketStatus complexo por algo direto
 */
export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Função para atualizar status
    const updateStatus = () => {
      setIsConnected(socketManager.isConnected());
    };

    // Atualizar status inicial
    updateStatus();

    // Verificar status a cada segundo
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    isConnecting,
    stats: socketManager.getStats(),
  };
}
