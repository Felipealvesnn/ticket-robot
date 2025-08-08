"use client";

import useSocket from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useEffect } from "react";

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

  // 2. Fazer join em todas as sessões quando socket conectar ou sessões mudarem
  useEffect(() => {
    if (isConnected && sessions.length > 0) {
      console.log(
        "🔌 SocketProvider: Fazendo join em",
        sessions.length,
        "sessões"
      );
      joinAllSessions();
    }
  }, [isConnected, sessions.length, joinAllSessions]);

  // 3. Log de status para debug
  useEffect(() => {
    if (isConnected) {
      console.log("✅ SocketProvider: Socket conectado e pronto");
    } else if (isConnecting) {
      console.log("🔄 SocketProvider: Conectando ao socket...");
    } else if (error) {
      console.error("❌ SocketProvider: Erro no socket:", error);
    }
  }, [isConnected, isConnecting, error]);

  return <>{children}</>;
}
