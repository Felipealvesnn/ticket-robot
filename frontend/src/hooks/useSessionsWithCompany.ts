import { useAuthStore } from "@/store/auth";
import { useSessionsStore } from "@/store/sessions";
import { useEffect } from "react";

/**
 * Hook que conecta o store de sessões com o store de auth
 * Automaticamente recarrega sessões quando a empresa atual muda
 */
export function useSessionsWithCompany() {
  const { currentCompanyId } = useAuthStore();
  const {
    sessions,
    isLoading,
    error,
    isReloadingForCompany,
    currentCompanyId: storeCompanyId,
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

  // Carregar sessões ao montar o componente
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Escutar mudanças na empresa atual e recarregar sessões
  useEffect(() => {
    if (currentCompanyId && currentCompanyId !== storeCompanyId) {
      handleCompanyChange(currentCompanyId);
    }
  }, [currentCompanyId, storeCompanyId, handleCompanyChange]);

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

    // Estados da empresa atual
    currentCompanyId,
  };
}
