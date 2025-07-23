"use client";

import { useSocketStatus } from "@/hooks/useSocketStatus";
import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useCallback, useEffect, useRef } from "react";

/**
 * Componente responsável por fazer o join automático em todas as sessões
 * quando há mudança de empresa, quando o socket se conecta/reconecta,
 * ou quando há mudanças nas sessões.
 *
 * Deve ser usado no layout principal para garantir conexão constante.
 */
export default function SessionsAutoJoiner() {
  const { currentCompanyId } = useAuthStore();
  const { sessions, loadSessions, joinAllSessions } = useSessionsStore();
  const { isConnected } = useSocketStatus();

  const lastCompanyIdRef = useRef<string | null>(null);
  const sessionsIdsRef = useRef<Set<string>>(new Set());
  const wasConnectedRef = useRef<boolean>(false); // 🔥 NOVO: Rastrear estado anterior da conexão

  // Função para detectar mudanças nas sessões
  const detectSessionChanges = useCallback(() => {
    const currentSessionIds = new Set(sessions.map((s) => s.id));
    const hasChanged =
      currentSessionIds.size !== sessionsIdsRef.current.size ||
      [...currentSessionIds].some((id) => !sessionsIdsRef.current.has(id));

    if (hasChanged) {
      sessionsIdsRef.current = currentSessionIds;
      return true;
    }
    return false;
  }, [sessions]);

  // Carregar sessões e fazer join quando a empresa mudar
  useEffect(() => {
    if (currentCompanyId && currentCompanyId !== lastCompanyIdRef.current) {
      console.log(
        "🏢 AutoJoiner: Empresa mudou, recarregando sessões...",
        currentCompanyId
      );

      // Atualizar a referência
      lastCompanyIdRef.current = currentCompanyId;

      // Limpar cache de sessões
      sessionsIdsRef.current.clear();

      // Recarregar sessões da nova empresa
      loadSessions();
    }
  }, [currentCompanyId, loadSessions]);

  // Fazer join em todas as sessões quando há mudanças OU quando reconecta
  useEffect(() => {
    if (isConnected && sessions.length > 0) {
      const hasSessionChanges = detectSessionChanges();
      const justReconnected = !wasConnectedRef.current && isConnected; // 🔥 NOVO: Detectar reconexão

      // Atualizar o estado anterior da conexão
      wasConnectedRef.current = isConnected;

      if (hasSessionChanges || justReconnected) {
        const reason = justReconnected
          ? "Socket reconectou"
          : "Sessões mudaram";

        console.log(
          `🔌 AutoJoiner: Fazendo join em sessões... (${reason})`,
          sessions.length
        );
        joinAllSessions();
      }
    } else {
      // 🔥 NOVO: Atualizar estado quando desconectado
      wasConnectedRef.current = isConnected;
    }
  }, [isConnected, sessions, joinAllSessions, detectSessionChanges]);

  // Este componente não renderiza nada, apenas gerencia as conexões
  return null;
}
