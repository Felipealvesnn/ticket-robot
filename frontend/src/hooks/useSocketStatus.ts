"use client";

import socketManager from "@/services/socketManager";
import { useEffect, useState } from "react";

/**
 * 🔥 HOOK APENAS PARA STATUS DO SOCKET - OTIMIZADO
 * ✅ NÃO registra callbacks (evita conflitos)
 * ✅ Apenas monitora o estado da conexão
 * ✅ Para ser usado em componentes que só precisam saber se está conectado
 * 🔥 NOVO: Usa estado direto do socketManager sem polling
 */
export function useSocketStatus() {
  // 🔥 OTIMIZAÇÃO: Estado direto do socketManager
  // ✅ Não precisa de polling - o socket já gerencia o estado
  const [isConnected, setIsConnected] = useState(() =>
    socketManager.isConnected()
  );

  useEffect(() => {
    // Verificar mudanças no status do socket periodicamente
    // Como não podemos escutar eventos diretamente (para evitar conflitos),
    // fazemos polling leve a cada 500ms
    const interval = setInterval(() => {
      const currentStatus = socketManager.isConnected();
      setIsConnected((prev) => {
        if (prev !== currentStatus) {
          console.log(
            "🔄 useSocketStatus: Status mudou:",
            prev,
            "->",
            currentStatus
          );
        }
        return currentStatus;
      });
    }, 500); // 500ms é rápido o suficiente para ser responsivo

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    stats: socketManager.getStats(),
  };
}

export default useSocketStatus;
