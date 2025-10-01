"use client";

import useSocket from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useCallback, useEffect, useRef } from "react";

interface SocketProviderProps {
  children: React.ReactNode;
}

/**
 * 🚀 SOCKET PROVIDER UNIFICADO
 * Centraliza TODA a lógica de socket em um só lugar
 * Substitui: SessionsAutoJoiner + SessionsMessageListener
 */
export default function SocketProvider({ children }: SocketProviderProps) {
  const { user, currentCompanyId } = useAuthStore();
  const { sessions, loadSessions, joinAllSessions } = useSessionsStore();
  const { isConnected, isConnecting, error } = useSocket();

  // 🔥 PERFORMANCE: Refs para controle de estado e debounce
  const prevConnectedRef = useRef(isConnected);
  const lastJoinTimeRef = useRef(0);
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔥 PERFORMANCE: Debounced join function
  const debouncedJoinAllSessions = useCallback(() => {
    const now = Date.now();
    const timeSinceLastJoin = now - lastJoinTimeRef.current;

    // Evitar joins muito frequentes (mínimo 1 segundo para melhor responsividade)
    if (timeSinceLastJoin < 1000) {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }

      joinTimeoutRef.current = setTimeout(() => {
        if (sessions.length > 0) {
          // Verificar novamente se ainda tem sessões
          console.log("🔌 Join em", sessions.length, "sessões");
          joinAllSessions();
          lastJoinTimeRef.current = Date.now();
        }
      }, 1000 - timeSinceLastJoin);

      return;
    }

    // Join imediato se passou tempo suficiente
    if (sessions.length > 0) {
      console.log("🔌 Join imediato em", sessions.length, "sessões");
      joinAllSessions();
      lastJoinTimeRef.current = now;
    }
  }, [joinAllSessions, sessions.length]);

  // 1. Carregar sessões quando empresa mudar
  useEffect(() => {
    if (currentCompanyId) {
      console.log(
        "🏢 SocketProvider: Carregando sessões da empresa",
        currentCompanyId
      );
      loadSessions();
    }
  }, [currentCompanyId, loadSessions]);

  // 2. UNIFICADO: Gerenciar joins de forma inteligente
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    const isNowConnected = isConnected;

    // Atualizar referência
    prevConnectedRef.current = isConnected;

    // Só fazer join se tem sessões E (reconectou OU é primeira conexão com sessões)
    if (isNowConnected && sessions.length > 0 && !wasConnected) {
      console.log("🔄 SocketProvider: Reconexão/primeira conexão detectada");
      debouncedJoinAllSessions();
    }

    // Cleanup do timeout ao desmontar
    return () => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
    };
  }, [isConnected, sessions.length, debouncedJoinAllSessions]);

  return <>{children}</>;
}
