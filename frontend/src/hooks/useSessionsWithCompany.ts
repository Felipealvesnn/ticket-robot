import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useEffect } from "react";

/**
 * Hook que conecta o store de sessões com o store de auth
 * Automaticamente recarrega sessões quando a empresa atual muda
 *
 * NOTA: O join automático nas sessões é feito pelo SessionsAutoJoiner
 * que fica no AuthProvider, então não precisa ser feito aqui.
 */
export function useSessionsWithCompany() {
  const { currentCompanyId } = useAuthStore();
  const {
    sessions,
    isLoading,
    error,
    isReloadingForCompany,
    handleCompanyChange,
    loadSessions,
    addSession,
    removeSession,
    restartSession,
    // Socket states
    sessionStatuses,
    sessionQrCodes,
    getSessionStatus,
    getSessionQrCode,
  } = useSessionsStore();

  // Carregar sessões apenas se ainda não foram carregadas
  // (o SessionsAutoJoiner já faz isso quando muda a empresa)
  useEffect(() => {
    if (sessions.length === 0 && !isLoading && currentCompanyId) {
      console.log("📱 useSessionsWithCompany: Carregando sessões iniciais...");
      loadSessions();
    }
  }, [sessions.length, isLoading, currentCompanyId, loadSessions]);

  // Escutar mudanças na empresa atual e recarregar sessões automaticamente
  useEffect(() => {
    if (currentCompanyId) {
      console.log("🏢 Hook detectou mudança de empresa:", currentCompanyId);
      handleCompanyChange();
    }
  }, [currentCompanyId, handleCompanyChange]);

  return {
    // Estados das sessões
    sessions,
    isLoading,
    error,
    isReloadingForCompany,

    // Ações CRUD
    addSession,
    removeSession,
    restartSession,
    loadSessions,

    // Estados de Socket/QR Code
    sessionStatuses,
    sessionQrCodes,
    getSessionStatus,
    getSessionQrCode,

    // Estado da empresa atual (apenas leitura)
    currentCompanyId,
  };
}
