"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react";

/**
 * Componente responsável por escutar mensagens de todas as sessões
 * e manter o estado das conversas atualizado.
 *
 * Por agora, o useSocket já gerencia os listeners de mensagens.
 * Este componente pode ser usado para adicionar lógica adicional no futuro.
 */
export default function SessionsMessageListener() {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    console.log(
      "📬 SessionsMessageListener: Socket conectado, listeners ativos..."
    );

    // Aqui poderia adicionar lógica adicional de processamento de mensagens
    // se necessário no futuro

    return () => {
      console.log("📬 SessionsMessageListener: Limpando listeners...");
    };
  }, [isConnected]);

  // Este componente não renderiza nada, apenas gerencia os listeners
  return null;
}
