import { useSocketSessions } from "@/hooks/useSocketSessions";
import socketService from "@/services/socket";
import { useSessionsStore } from "@/store/sessions";
import { useEffect, useState } from "react";

interface QRCodeDisplayProps {
  sessionId: string;
  className?: string;
}

/**
 * Componente para exibir QR Code com atualizações em tempo real
 */
export function QRCodeDisplay({
  sessionId,
  className = "",
}: QRCodeDisplayProps) {
  const { getSessionQrCode, getQrCode, clearQrCode } = useSessionsStore();
  const { isSocketConnected } = useSocketSessions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obter QR Code específico da sessão
  const currentQrCode = getSessionQrCode(sessionId);
  const qrCodeData = useSessionsStore((state) => state.qrCodes.get(sessionId));

  // Auto-join na sessão quando o componente montar
  useEffect(() => {
    if (isSocketConnected && sessionId) {
      socketService.joinSession(sessionId);
      console.log(`📱 QRCodeDisplay: Entrou na sessão ${sessionId}`);
    }

    // Cleanup: sair da sessão quando desmontar
    // return () => {
    //   if (isSocketConnected && sessionId) {
    //     socketService.leaveSession(sessionId);
    //     console.log(`📱 QRCodeDisplay: Saiu da sessão ${sessionId}`);
    //   }
    // };
  }, [sessionId, isSocketConnected]);

  // Buscar QR Code inicial
  const fetchQrCode = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      await getQrCode(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar QR Code");
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar QR Code específico da sessão
  const handleClearQrCode = () => {
    clearQrCode(sessionId);
    setError(null);
  };

  return (
    <div className={`qr-code-display ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">QR Code da Sessão</h3>
        <div className="flex gap-2">
          <button
            onClick={fetchQrCode}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Carregando..." : "Atualizar"}
          </button>
          <button
            onClick={handleClearQrCode}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Limpar
          </button>
        </div>
      </div>

    

      {/* Timestamp da última atualização */}
      {qrCodeData?.timestamp && (
        <div className="mb-3 text-sm text-gray-600">
          🕒 Última atualização:{" "}
          {new Date(qrCodeData.timestamp).toLocaleString("pt-BR")}
        </div>
      )}

      {/* Área do QR Code */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
        {error && (
          <div className="text-center">
            <div className="text-red-500 mb-2">❌ {error}</div>
            <button
              onClick={fetchQrCode}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {isLoading && !currentQrCode && (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-gray-600">Carregando QR Code...</div>
          </div>
        )}

        {currentQrCode && !error && (
          <div className="text-center">
            {currentQrCode.startsWith("data:image") ? (
              // QR Code como imagem base64
              <img
                src={currentQrCode}
                alt="QR Code"
                className="max-w-full max-h-[300px] mx-auto"
              />
            ) : (
              // QR Code como texto (será convertido para imagem via biblioteca)
              <div className="bg-white p-4 rounded">
                <div className="text-xs text-gray-500 mb-2">
                  String QR Code:
                </div>
                <div className="font-mono text-sm break-all max-w-[300px]">
                  {currentQrCode}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  (Use uma biblioteca QR para gerar a imagem)
                </div>
              </div>
            )}
          </div>
        )}

        {!currentQrCode && !isLoading && !error && (
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📱</div>
            <div>Nenhum QR Code carregado</div>
            <button
              onClick={fetchQrCode}
              className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Carregar QR Code
            </button>
          </div>
        )}
      </div>

      {/* Instruções */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          💡 <strong>Dica:</strong> O QR Code será atualizado automaticamente
          quando houver mudanças via Socket.IO.
        </p>
        <p>📱 Escaneie com seu WhatsApp para conectar a sessão.</p>
      </div>
    </div>
  );
}
