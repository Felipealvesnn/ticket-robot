import { socketService } from "@/services/socket";
import { useSessionsStore } from "@/store/sessions";
import { useEffect } from "react";

/**
 * Hook personalizado para facilitar o uso de Socket com sessões
 * Centraliza toda a lógica de QR Codes e status de sessões
 */
export const useSessionSocket = (sessionId?: string) => {
  const {
    // Estado geral
    error,

    // Funções de sessão
    joinSession,
    leaveSession,
    getSessionQrCode,
    getSessionStatus,
    clearSessionQrCode,

    // Estados específicos
    sessionStatuses,
    sessionQrCodes,
  } = useSessionsStore();

  // Auto-join quando sessionId é fornecido
  useEffect(() => {
    if (sessionId && socketService.isConnected()) {
      joinSession(sessionId);

      return () => {
        leaveSession(sessionId);
      };
    }
  }, [sessionId, joinSession, leaveSession]);

  // Dados da sessão específica
  const sessionData = sessionId
    ? {
        qrCode: getSessionQrCode(sessionId),
        status: getSessionStatus(sessionId),
        statusData: sessionStatuses[sessionId],
        qrCodeData: sessionQrCodes[sessionId],
      }
    : null;

  return {
    // Estado geral do Socket
    isConnected: socketService.isConnected(),
    error,

    // Dados da sessão (se sessionId fornecido)
    sessionData,

    // Funções úteis
    joinSession,
    leaveSession,
    getQrCode: (id: string) => getSessionQrCode(id),
    getStatus: (id: string) => getSessionStatus(id),
    clearQrCode: (id: string) => clearSessionQrCode(id),

    // Estados completos (para uso avançado)
    allSessionStatuses: sessionStatuses,
    allSessionQrCodes: sessionQrCodes,
  };
};

export default useSessionSocket;
