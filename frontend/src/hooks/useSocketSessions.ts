import socketService from "@/services/socket";
import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useEffect } from "react";

/**
 * Hook para gerenciar conexão Socket.IO relacionada a sessões
 * Configura listeners para QR Code e status de sessões
 * Gerencia automaticamente join/leave em salas baseado no estado das sessões
 */
export function useSocketSessions() {
  const { setupSocketListeners, cleanupSocketListeners, sessions } =
    useSessionsStore();

  const { user, isAuthenticated } = useAuthStore();

  // 🔥 EFEITO 1: Configurar Socket.IO e listeners quando usuário autentica
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Obter token do localStorage
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.warn("⚠️ Token não encontrado");
      return;
    }

    // Configurar listeners apenas se estiver autenticado
    let isConnected = false;

    const initializeSocket = async () => {
      try {
        // Conectar ao socket se não estiver conectado
        if (!socketService.isConnected()) {
          await socketService.connect(token);
        }

        // Configurar listeners para eventos de sessão
        setupSocketListeners();
        isConnected = true;

        console.log("✅ Socket.IO configurado para sessões");
      } catch (error) {
        console.error("❌ Erro ao configurar Socket.IO para sessões:", error);
      }
    };

    initializeSocket();

    // Cleanup ao desmontar ou perder autenticação
    return () => {
      if (isConnected) {
        cleanupSocketListeners();
        console.log("🧹 Socket listeners removidos no cleanup");
      }
    };
  }, [isAuthenticated, user, setupSocketListeners, cleanupSocketListeners]);

  // 🔥 EFEITO 2: Auto-join/leave baseado nas sessões atuais
  useEffect(() => {
    if (
      !isAuthenticated ||
      !socketService.isConnected() ||
      sessions.length === 0
    ) {
      return;
    }

    // Join apenas em sessões ativas/conectadas
    const activeSessions = sessions.filter(
      (session) =>
        session.status === "connected" ||
        session.status === "connecting" ||
        session.status === "qr_ready"
    );

    console.log(
      `🔄 Gerenciando ${activeSessions.length} sessões ativas de ${sessions.length} total`
    );

    // Join nas sessões ativas
    activeSessions.forEach((session) => {
      socketService.joinSession(session.id);
      console.log(`✅ Auto-join: ${session.name} (${session.status})`);
    });

    if (activeSessions.length > 0) {
      console.log(`📱 Conectado a ${activeSessions.length} sessões ativas`);
    }

    // Cleanup: não precisamos fazer leave explícito porque
    // o próximo useEffect vai gerenciar as mudanças
  }, [isAuthenticated, sessions]); // Reagir a mudanças nas sessões

  /**
   * Forçar entrada em todas as sessões ativas (útil para refresh manual)
   */
  const joinAllActiveSessions = () => {
    if (!socketService.isConnected()) {
      console.warn(
        "⚠️ Socket não conectado, não é possível entrar nas sessões"
      );
      return;
    }

    const activeSessions = sessions.filter(
      (session) =>
        session.status === "connected" ||
        session.status === "connecting" ||
        session.status === "qr_ready"
    );

    activeSessions.forEach((session) => {
      socketService.joinSession(session.id);
      console.log(`🔄 Manual join: ${session.name} (${session.status})`);
    });

    console.log(`📱 Join manual em ${activeSessions.length} sessões ativas`);
  };

  /**
   * Sair de todas as salas de sessões
   */
  const leaveAllSessions = () => {
    if (!socketService.isConnected()) {
      return;
    }

    sessions.forEach((session) => {
      socketService.leaveSession(session.id);
    });

    console.log("📱 Saiu de todas as sessões");
  };

  /**
   * Join em uma sessão específica
   */
  const joinSession = (sessionId: string) => {
    if (!socketService.isConnected()) {
      console.warn("⚠️ Socket não conectado");
      return;
    }

    socketService.joinSession(sessionId);
    console.log(`📱 Join específico: ${sessionId}`);
  };

  /**
   * Leave de uma sessão específica
   */
  const leaveSession = (sessionId: string) => {
    if (!socketService.isConnected()) {
      return;
    }

    socketService.leaveSession(sessionId);
    console.log(`📱 Leave específico: ${sessionId}`);
  };

  return {
    // Funções utilitárias (principalmente para debug/casos especiais)
    joinAllActiveSessions,
    leaveAllSessions,
    joinSession,
    leaveSession,
    isSocketConnected: socketService.isConnected(),
    activeSessionsCount: sessions.filter(
      (s) =>
        s.status === "connected" ||
        s.status === "connecting" ||
        s.status === "qr_ready"
    ).length,
  };
}
