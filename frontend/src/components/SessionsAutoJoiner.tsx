"use client";

import { useSocketStatus } from "@/hooks/useSocketStatus";
import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useCallback, useEffect, useRef } from "react";

/**
 * Componente responsável por fazer o join automático em todas as sessões
 * quando há mudança de empresa ou quando o socket se conecta.
 *
 * Deve ser usado no layout principal para garantir conexão constante.
 */
export default function SessionsAutoJoiner() {
  const { currentCompanyId } = useAuthStore();
  const { sessions, loadSessions, joinAllSessions } = useSessionsStore();
  const { isConnected } = useSocketStatus();

  const lastCompanyIdRef = useRef<string | null>(null);
  const sessionsIdsRef = useRef<Set<string>>(new Set());

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

  // Fazer join em todas as sessões quando há mudanças
  useEffect(() => {
    if (isConnected && sessions.length > 0) {
      const hasSessionChanges = detectSessionChanges();

      if (hasSessionChanges) {
        console.log(
          "� AutoJoiner: Fazendo join em sessões...",
          sessions.length
        );
        joinAllSessions();
      }
    }
  }, [isConnected, sessions, joinAllSessions, detectSessionChanges]);

  // Este componente não renderiza nada, apenas gerencia as conexões
  return null;
}
