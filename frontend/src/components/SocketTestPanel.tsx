import socketService from "@/services/socket";
import { useSessionsStore } from "@/store/sessions";
import { useEffect, useState } from "react";

export function SocketTestPanel() {
  const {
    testSocketConnection,
    forceJoinAllSessions,
    sessions,
    currentQrCode,
    qrCodeTimestamp,
  } = useSessionsStore();

  const [logs, setLogs] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const addEvent = (event: string, data: any) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    setEvents((prev) => [{ timestamp, event, data }, ...prev].slice(0, 10));
  };

  useEffect(() => {
    // Configurar listeners específicos para debug
    const handleQRCode = (data: any) => {
      addLog(`🔥 QR Code recebido: ${data.sessionId}`);
      addEvent("qr-code", data);
    };

    const handleQRCodeImage = (data: any) => {
      addLog(`🖼️ QR Code Image recebido: ${data.sessionId}`);
      addEvent("qr-code-image", data);
    };

    const handleSessionStatus = (data: any) => {
      addLog(`📱 Status sessão: ${data.sessionId} -> ${data.status}`);
      addEvent("session-status", data);
    };

    const handleJoinedSession = (data: any) => {
      addLog(
        `✅ Joined sessão: ${data.sessionId} (${data.clientsInRoom} clientes)`
      );
      addEvent("joined-session", data);
    };

    const handleError = (data: any) => {
      addLog(`❌ Erro: ${data.message}`);
      addEvent("error", data);
    };

    socketService.on("qr-code", handleQRCode);
    socketService.on("qr-code-image", handleQRCodeImage);
    socketService.on("session-status", handleSessionStatus);
    socketService.on("session-status-global", handleSessionStatus);
    socketService.on("joined-session", handleJoinedSession);
    socketService.on("error", handleError);

    return () => {
      socketService.off("qr-code", handleQRCode);
      socketService.off("qr-code-image", handleQRCodeImage);
      socketService.off("session-status", handleSessionStatus);
      socketService.off("session-status-global", handleSessionStatus);
      socketService.off("joined-session", handleJoinedSession);
      socketService.off("error", handleError);
    };
  }, []);

  const handleTestConnection = () => {
    const result = testSocketConnection();
    addLog(`🔍 Teste conexão: ${result ? "✅ Conectado" : "❌ Desconectado"}`);
  };

  const handleForceJoin = () => {
    const result = forceJoinAllSessions();
    addLog(`🔄 Force join: ${result ? "✅ Sucesso" : "❌ Falhou"}`);
  };

  const handleJoinSpecific = (sessionId: string) => {
    socketService.joinSession(sessionId);
    addLog(`📱 Join manual: ${sessionId}`);
  };

  const handleClearLogs = () => {
    setLogs([]);
    setEvents([]);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">🔧 Socket.IO Debug Panel</h3>

      {/* Status */}
      <div className="mb-4 p-3 bg-white rounded border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Socket Status:</strong>
            <span
              className={`ml-2 ${
                socketService.isConnected() ? "text-green-600" : "text-red-600"
              }`}
            >
              {socketService.isConnected() ? "✅ Conectado" : "❌ Desconectado"}
            </span>
          </div>
          <div>
            <strong>Sessões:</strong> {sessions.length}
          </div>
          <div>
            <strong>QR Code:</strong>
            <span
              className={`ml-2 ${
                currentQrCode ? "text-green-600" : "text-gray-500"
              }`}
            >
              {currentQrCode ? "✅ Carregado" : "❌ Vazio"}
            </span>
          </div>
          <div>
            <strong>Última atualização:</strong>
            <span className="ml-2 text-xs text-gray-500">
              {qrCodeTimestamp
                ? new Date(qrCodeTimestamp).toLocaleTimeString("pt-BR")
                : "Nunca"}
            </span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="mb-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleTestConnection}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            🔍 Testar Conexão
          </button>
          <button
            onClick={handleForceJoin}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            🔄 Force Join All
          </button>
          <button
            onClick={handleClearLogs}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            🧹 Limpar Logs
          </button>
        </div>

        {/* Join específico por sessão */}
        {sessions.length > 0 && (
          <div className="mt-2">
            <label className="text-sm font-medium">Join específico:</label>
            <div className="flex gap-1 flex-wrap mt-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleJoinSpecific(session.id)}
                  className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200"
                >
                  📱 {session.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logs em tempo real */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">
          📋 Logs Recentes ({logs.length}/20)
        </h4>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-40 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Aguardando eventos...</div>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>

      {/* Eventos detalhados */}
      <div>
        <h4 className="font-medium mb-2">
          📊 Eventos Detalhados ({events.length}/10)
        </h4>
        <div className="bg-white rounded border max-h-40 overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm">
              Nenhum evento recebido
            </div>
          ) : (
            events.map((event, index) => (
              <div key={index} className="border-b last:border-b-0 p-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{event.event}</span>
                  <span className="text-xs text-gray-500">
                    {event.timestamp}
                  </span>
                </div>
                <pre className="text-xs mt-1 overflow-hidden">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
