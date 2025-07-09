"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react";

/**
 * Componente responsável por escutar mensagens de todas as sessões
 * e manter o estado das conversas atualizado.
 *
 * Deve ser usado junto com o SessionsAutoJoiner no layout principal.
 */
export default function SessionsMessageListener() {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Aqui você pode adicionar listeners para eventos específicos
    // como mensagens, mudanças de status, etc.

    console.log("📬 SessionsMessageListener: Ouvindo mensagens das sessões...");

    // Exemplo de como escutar mensagens:
    // socketManager.on('message', (data) => {
    //   console.log('Nova mensagem recebida:', data);
    //   // Atualizar store de mensagens/tickets
    // });

    // socketManager.on('session:status', (data) => {
    //   console.log('Status da sessão mudou:', data);
    //   // Atualizar store de sessões
    // });

    // Cleanup seria feito aqui
    return () => {
      console.log("📬 SessionsMessageListener: Limpando listeners...");
      // socketManager.off('message');
      // socketManager.off('session:status');
    };
  }, [isConnected]);

  // Este componente não renderiza nada, apenas gerencia os listeners
  return null;
}
