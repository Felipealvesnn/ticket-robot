import { useSessionSocket } from "@/hooks/useSessionSocket";
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
  const { sessionData, isConnected, clearQrCode } = useSessionSocket(sessionId); // Auto-join na sessão

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obter QR Code da sessão
  const currentQrCode = sessionData?.qrCode;
  const qrCodeTimestamp = sessionData?.qrCodeData?.timestamp;

  // Debug: log quando QR Code muda
  useEffect(() => {
    if (currentQrCode) {
      console.log(
        `🎯 QRCodeDisplay: QR Code atualizado para sessão ${sessionId}`,
        {
          hasQrCode: !!currentQrCode,
          timestamp: qrCodeTimestamp,
          qrCodePreview: currentQrCode?.substring(0, 50) + "...",
        }
      );
    }
  }, [currentQrCode, sessionId, qrCodeTimestamp]);

  // Limpar QR Code específico da sessão
  const handleClearQrCode = () => {
    clearQrCode(sessionId);
    setError(null);
  };

  return (
    <div className={`qr-code-display ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">QR Code da Sessão</h3>
      </div>

      {/* Timestamp da última atualização */}
      {qrCodeTimestamp && (
        <div className="mb-3 text-sm text-gray-600">
          🕒 Última atualização:{" "}
          {new Date(qrCodeTimestamp).toLocaleString("pt-BR")}
        </div>
      )}

      {/* Área do QR Code */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
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
            <div className="text-4xl mb-2">⏳</div>
            <div>Aguardando QR Code...</div>
            <div className="text-sm mt-2">
              O QR Code aparecerá instantaneamente após a criação da sessão
            </div>
          </div>
        )}
      </div>

      {/* Instruções */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          � <strong>QR Code Instantâneo:</strong> O QR Code aparece
          imediatamente após criar a sessão
        </p>
        <p>
          🔄 <strong>Atualizações em Tempo Real:</strong> Será atualizado
          automaticamente via Socket.IO
        </p>
        <p>📱 Escaneie com seu WhatsApp para conectar a sessão.</p>
      </div>
    </div>
  );
}
