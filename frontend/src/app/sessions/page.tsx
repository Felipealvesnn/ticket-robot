"use client";

import { QRCodeDisplay } from "@/app/sessions/componentes/QRCodeDisplay";
import { useSocketSessions } from "@/hooks/useSocketSessions";
import { useSessionsStore } from "@/store/sessions";
import { useEffect, useState } from "react";

export default function SessionsPage() {
  const {
    sessions,
    isLoading,
    error,
    addSession,
    connectSession,
    disconnectSession,
    removeSession,
    loadSessions,
  } = useSessionsStore();
  const [newSessionName, setNewSessionName] = useState("");
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);

  // Configurar Socket.IO para sessões
  useSocketSessions();

  // Carregar sessões ao montar o componente
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;

    await addSession(newSessionName);
    setNewSessionName("");
    setShowNewSessionForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "connecting":
        return "bg-yellow-100 text-yellow-800";
      case "disconnected":
        return "bg-gray-100 text-gray-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "connecting":
        return "Conectando...";
      case "disconnected":
        return "Desconectado";
      case "error":
        return "Erro";
      default:
        return "Desconhecido";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sessões WhatsApp
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie suas conexões WhatsApp e visualize QR Codes
            </p>
          </div>
          <button
            onClick={() => setShowNewSessionForm(true)}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            Nova Sessão
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Modal para Nova Sessão */}
      {showNewSessionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Criar Nova Sessão
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Sessão
              </label>
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: sessao-vendas"
                disabled={isLoading}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateSession}
                disabled={isLoading || !newSessionName.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? "Criando..." : "Criar"}
              </button>
              <button
                onClick={() => {
                  setShowNewSessionForm(false);
                  setNewSessionName("");
                }}
                disabled={isLoading}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {session.name}
              </h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                  session.status
                )}`}
              >
                {getStatusText(session.status)}
              </span>
            </div>

            {/* QR Code Display com tempo real */}
            {(session.status === "connecting" ||
              session.status === "qr_ready") && (
              <QRCodeDisplay sessionId={session.id} />
            )}

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    session.status === "connected"
                      ? "text-green-600"
                      : session.status === "connecting"
                      ? "text-yellow-600"
                      : session.status === "error"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {getStatusText(session.status)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Criado em:</span>
                <span className="text-gray-900">
                  {new Date(session.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Última atividade:</span>
                <span className="text-gray-900">{session.lastActivity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mensagens:</span>
                <span className="text-gray-900">{session.messagesCount}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                {session.status === "connected" ? (
                  <button
                    onClick={() => disconnectSession(session.id)}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 transition-colors duration-200"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    onClick={() => connectSession(session.id)}
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-200 transition-colors duration-200"
                  >
                    Conectar
                  </button>
                )}
                <button
                  onClick={() => removeSession(session.id)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors duration-200"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
