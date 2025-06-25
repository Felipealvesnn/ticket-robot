"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SocketIndicator from "@/components/SocketIndicator";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { useSocketStore } from "@/store/socket";
import { useState } from "react";

export default function SocketTestPage() {
  const { socket, isConnected } = useSocket();
  const {
    activeSessions,
    activeTickets,
    recentMessages,
    sessionStatuses,
    ticketStatuses,
    joinSession,
    leaveSession,
    joinTicket,
    leaveTicket,
    sendMessage,
  } = useSocketStore();

  const [testSessionId, setTestSessionId] = useState("test-session-001");
  const [testTicketId, setTestTicketId] = useState("test-ticket-001");
  const [messageContent, setMessageContent] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev.slice(-19),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  // Escutar eventos do socket
  useSocketEvent("session:status", (data) => {
    addLog(`Session Status - ${data.sessionId}: ${data.status}`);
  });

  useSocketEvent("session:qr-code", (data) => {
    addLog(`QR Code recebido para sessão ${data.sessionId}`);
  });

  useSocketEvent("ticket:created", (data) => {
    addLog(`Ticket criado: ${data.ticketId} (Contact: ${data.contactId})`);
  });

  useSocketEvent("ticket:updated", (data) => {
    addLog(`Ticket atualizado: ${data.ticketId} - Status: ${data.status}`);
  });

  useSocketEvent("message:new", (data) => {
    addLog(
      `Nova mensagem no ticket ${data.ticketId}: ${data.content.substring(
        0,
        50
      )}...`
    );
  });

  useSocketEvent("message:delivery", (data) => {
    addLog(`Delivery status: ${data.messageId} - ${data.status}`);
  });

  useSocketEvent("flow:execution", (data) => {
    addLog(
      `Flow execution: ${data.flowId} - ${data.action} (Node: ${data.nodeId})`
    );
  });

  useSocketEvent("error", (data) => {
    addLog(`❌ Erro: ${data.message}`);
  });

  const handleJoinSession = () => {
    if (testSessionId.trim()) {
      joinSession(testSessionId);
      addLog(`📱 Tentando entrar na sessão: ${testSessionId}`);
    }
  };

  const handleLeaveSession = () => {
    if (testSessionId.trim()) {
      leaveSession(testSessionId);
      addLog(`📱 Saindo da sessão: ${testSessionId}`);
    }
  };

  const handleJoinTicket = () => {
    if (testTicketId.trim()) {
      joinTicket(testTicketId);
      addLog(`🎫 Tentando entrar no ticket: ${testTicketId}`);
    }
  };

  const handleLeaveTicket = () => {
    if (testTicketId.trim()) {
      leaveTicket(testTicketId);
      addLog(`🎫 Saindo do ticket: ${testTicketId}`);
    }
  };

  const handleSendMessage = () => {
    if (testTicketId.trim() && messageContent.trim()) {
      const success = sendMessage(testTicketId, messageContent);
      if (success) {
        addLog(
          `💬 Mensagem enviada para ticket ${testTicketId}: ${messageContent}`
        );
        setMessageContent("");
      } else {
        addLog(`❌ Falha ao enviar mensagem - Socket não conectado`);
      }
    }
  };

  const handleEmitTestEvent = () => {
    if (socket) {
      socket.emit("test-event", {
        message: "Hello from frontend!",
        timestamp: new Date().toISOString(),
      });
      addLog("🧪 Evento de teste enviado");
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Teste de Socket.IO
          </h1>
          <p className="text-gray-600">
            Interface para testar a comunicação em tempo real com o backend
          </p>
        </div>

        {/* Status da Conexão */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Status da Conexão</h2>
          <div className="flex items-center justify-between">
            <SocketIndicator />
            <div className="text-sm text-gray-600">
              Socket ID: {socket?.id || "N/A"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controles de Sessão */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Controles de Sessão</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID da Sessão
                </label>
                <input
                  type="text"
                  value={testSessionId}
                  onChange={(e) => setTestSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite o ID da sessão"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleJoinSession}
                  disabled={!isConnected}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Entrar na Sessão
                </button>
                <button
                  onClick={handleLeaveSession}
                  disabled={!isConnected}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Sair da Sessão
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Sessões ativas: {activeSessions.join(", ") || "Nenhuma"}
              </div>
            </div>
          </div>

          {/* Controles de Ticket */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Controles de Ticket</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Ticket
                </label>
                <input
                  type="text"
                  value={testTicketId}
                  onChange={(e) => setTestTicketId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite o ID do ticket"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleJoinTicket}
                  disabled={!isConnected}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Entrar no Ticket
                </button>
                <button
                  onClick={handleLeaveTicket}
                  disabled={!isConnected}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Sair do Ticket
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Tickets ativos: {activeTickets.join(", ") || "Nenhum"}
              </div>
            </div>
          </div>

          {/* Envio de Mensagem */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Enviar Mensagem</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo da Mensagem
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite a mensagem..."
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || !messageContent.trim()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                Enviar Mensagem
              </button>
            </div>
          </div>

          {/* Teste Genérico */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Teste Genérico</h2>
            <div className="space-y-4">
              <button
                onClick={handleEmitTestEvent}
                disabled={!isConnected}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Enviar Evento de Teste
              </button>
              <div className="text-sm text-gray-600">
                Envia um evento genérico para testar a conectividade
              </div>
            </div>
          </div>
        </div>

        {/* Log de Eventos */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Log de Eventos</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">
                Nenhum evento registrado ainda...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setLogs([])}
            className="mt-2 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Limpar Log
          </button>
        </div>

        {/* Estado das Sessões e Tickets */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Status das Sessões</h3>
            {Object.keys(sessionStatuses).length === 0 ? (
              <p className="text-gray-500">Nenhuma sessão monitorada</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(sessionStatuses).map(([sessionId, status]) => (
                  <div
                    key={sessionId}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{sessionId}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        status.status === "connected"
                          ? "bg-green-100 text-green-800"
                          : status.status === "connecting"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {status.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Status dos Tickets</h3>
            {Object.keys(ticketStatuses).length === 0 ? (
              <p className="text-gray-500">Nenhum ticket monitorado</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(ticketStatuses).map(([ticketId, status]) => (
                  <div
                    key={ticketId}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{ticketId}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        status.status === "open"
                          ? "bg-green-100 text-green-800"
                          : status.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {status.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
