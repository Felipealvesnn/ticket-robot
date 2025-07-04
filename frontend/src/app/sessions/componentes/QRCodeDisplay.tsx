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

  // Obter QR Code e status da sessão
  const currentQrCode = sessionData?.qrCode;
  const qrCodeTimestamp = sessionData?.qrCodeData?.timestamp;
  const sessionStatus = sessionData?.status;

  // Verificar se a sessão está conectada
  const isSessionConnected =
    sessionStatus === "connected" || sessionStatus === "authenticated";

  // Debug: log quando QR Code ou status muda
  useEffect(() => {
    console.log(`🎯 QRCodeDisplay: Estado da sessão ${sessionId}`, {
      hasQrCode: !!currentQrCode,
      status: sessionStatus,
      isConnected: isSessionConnected,
      timestamp: qrCodeTimestamp,
      shouldShowQR: !isSessionConnected,
      shouldShowConnected: isSessionConnected,
    });

    // Debug específico para mudanças de status
    if (sessionStatus === "disconnected") {
      console.log(
        `🔌 Sessão ${sessionId} desconectada - deveria mostrar layout para reconectar`
      );
    }
    if (sessionStatus === "connected") {
      console.log(
        `✅ Sessão ${sessionId} conectada - deveria mostrar status conectado`
      );
    }
  }, [
    currentQrCode,
    sessionStatus,
    isSessionConnected,
    sessionId,
    qrCodeTimestamp,
  ]);

  // Limpar QR Code específico da sessão
  const handleClearQrCode = () => {
    clearQrCode(sessionId);
    setError(null);
  };

  return (
    <div className={`qr-code-display ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isSessionConnected ? "Status da Sessão" : "QR Code da Sessão"}
        </h3>
      </div>

      {/* Timestamp da última atualização */}
      {qrCodeTimestamp && !isSessionConnected && (
        <div className="mb-3 text-sm text-gray-600">
          🕒 Última atualização:{" "}
          {new Date(qrCodeTimestamp).toLocaleString("pt-BR")}
        </div>
      )}

      {/* Área do conteúdo principal */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
        {/* SESSÃO CONECTADA - Mostrar status de sucesso */}
        {isSessionConnected && (
          <div className="text-center">
            <div className="text-6xl mb-4 text-green-500">✅</div>
            <div className="text-xl font-semibold text-green-600 mb-2">
              WhatsApp Conectado!
            </div>
            <div className="text-gray-600 mb-4">
              A sessão está ativa e pronta para enviar/receber mensagens
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-700">
                <strong>Status:</strong>{" "}
                {sessionStatus === "connected" ? "Conectado" : "Autenticado"}
              </div>
              <div className="text-sm text-green-600 mt-1">
                Você pode agora enviar e receber mensagens através desta sessão
              </div>
            </div>
          </div>
        )}

        {/* CARREGANDO QR CODE */}
        {!isSessionConnected && isLoading && !currentQrCode && (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-gray-600">Carregando QR Code...</div>
          </div>
        )}

        {/* EXIBIR QR CODE */}
        {!isSessionConnected && currentQrCode && !error && (
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

        {/* AGUARDANDO QR CODE ou DESCONECTADO */}
        {!isSessionConnected && !currentQrCode && !isLoading && !error && (
          <div className="text-center text-gray-500">
            {sessionStatus === "disconnected" ? (
              <>
                <div className="text-4xl mb-2">🔌</div>
                <div className="text-lg font-medium text-orange-600 mb-2">
                  Sessão Desconectada
                </div>
                <div className="text-sm">
                  Use o botão "Reconectar" para gerar um novo QR Code
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">⏳</div>
                <div>Aguardando QR Code...</div>
                <div className="text-sm mt-2">
                  O QR Code aparecerá instantaneamente após a criação da sessão
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Instruções */}
      <div className="mt-4 text-sm text-gray-600">
        {isSessionConnected ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700">
              🎉 <strong>Sessão Ativa:</strong> Sua sessão WhatsApp está
              funcionando perfeitamente!
            </p>
            <p className="text-blue-600 mt-1">
              💬 Você pode agora gerenciar conversas e enviar mensagens através
              desta sessão.
            </p>
          </div>
        ) : (
          <>
            <p>
              🔄 <strong>Atualizações em Tempo Real:</strong> QR Code será
              atualizado automaticamente
            </p>
            <p>📱 Escaneie com seu WhatsApp para conectar a sessão.</p>
          </>
        )}
      </div>
    </div>
  );
}
