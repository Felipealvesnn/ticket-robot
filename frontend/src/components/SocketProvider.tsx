"use client";

import useSocket from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useEffect, useRef } from "react";

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

  // 🔥 NOVO: Ref para rastrear estado anterior da conexão
  const prevConnectedRef = useRef(isConnected);

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
  // 🔥 NOVO: Também reagir a reconexões (não apenas mudanças de estado)
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

  // 3. Reagir especificamente a reconexões (quando socket muda de desconectado → conectado)
  useEffect(() => {
    // Se mudou de false → true = reconexão
    if (!prevConnectedRef.current && isConnected && sessions.length > 0) {
      console.log("🔄 SocketProvider: Detectada reconexão, refazendo joins...");
      joinAllSessions();
    }
    
    // Atualizar referência
    prevConnectedRef.current = isConnected;
  }, [isConnected, sessions.length, joinAllSessions]);



  return <>{children}</>;
}
