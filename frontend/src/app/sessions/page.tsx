"use client";

import { QRCodeDisplay } from "@/app/sessions/componentes/QRCodeDisplay";
import { useSessionsWithCompany } from "@/hooks/useSessionsWithCompany";
import { useSocketStatus } from "@/hooks/useSocketStatus";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function SessionsPage() {
  const {
    sessions,
    isLoading,
    error,
    isReloadingForCompany,
    addSession,
    restartSession,
    removeSession,
  } = useSessionsWithCompany();

  const [newSessionName, setNewSessionName] = useState("");
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Configurar Socket.IO para sessões e monitoramento
  const { isConnected: socketConnected } = useSocketStatus();

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;

    await addSession(newSessionName);
    setNewSessionName("");
    setShowNewSessionForm(false);
  };

  const handleRemoveSession = async () => {
    if (!sessionToDelete) return;

    await removeSession(sessionToDelete);
    setSessionToDelete(null);
  };

  const confirmRemoveSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
  };

  const cancelRemoveSession = () => {
    setSessionToDelete(null);
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
          <div className="flex items-center space-x-4">
            {/* Indicador de Status do Socket */}
            <div className="flex items-center space-x-2 text-sm">
              <div
                className={`w-3 h-3 rounded-full ${
                  socketConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-gray-600">
                Socket {socketConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>

            <button
              onClick={() => setShowNewSessionForm(true)}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              Nova Sessão
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isReloadingForCompany && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-blue-800">
                Atualizando sessões para a nova empresa...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Nova Sessão */}
      {showNewSessionForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => {
                setShowNewSessionForm(false);
                setNewSessionName("");
              }}
            />

            {/* Center alignment trick */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            {/* Modal panel */}
            <div
              className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Criar Nova Sessão
                  </h3>
                  <button
                    onClick={() => {
                      setShowNewSessionForm(false);
                      setNewSessionName("");
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Sessão
                  </label>
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: sessao-vendas"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        newSessionName.trim() &&
                        !isLoading
                      ) {
                        handleCreateSession();
                      } else if (e.key === "Escape") {
                        setShowNewSessionForm(false);
                        setNewSessionName("");
                      }
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowNewSessionForm(false);
                    setNewSessionName("");
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={isLoading || !newSessionName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? "Criando..." : "Criar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Remover Sessão */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={cancelRemoveSession}
            />

            {/* Center alignment trick */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            {/* Modal panel */}
            <div
              className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    ⚠️ Confirmar Remoção
                  </h3>
                  <button
                    onClick={cancelRemoveSession}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="text-gray-600 mb-6">
                  <p className="mb-3">
                    Tem certeza que deseja remover esta sessão?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium text-sm mb-2">
                      ⚠️ ATENÇÃO: Esta ação irá remover:
                    </p>
                    <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                      <li>Todas as conversas</li>
                      <li>Todos os contatos</li>
                      <li>Todos os tickets</li>
                      <li>Todas as mensagens</li>
                      <li>Todo o histórico</li>
                    </ul>
                    <p className="text-red-800 font-medium text-sm mt-3">
                      Esta ação não pode ser desfeita!
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-3">
                <button
                  onClick={cancelRemoveSession}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRemoveSession}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? "Removendo..." : "Sim, Remover TUDO"}
                </button>
              </div>
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

            {/* QR Code Display apenas para sessões não conectadas */}
            {session.status !== "connected" && (
              <div className="mb-4">
                <QRCodeDisplay sessionId={session.id} />
              </div>
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
                    onClick={() => restartSession(session.id)}
                    title="Reinicia apenas o cliente WhatsApp. Dados preservados."
                    className="flex-1 bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg text-sm hover:bg-yellow-200 transition-colors duration-200"
                  >
                    Reiniciar Cliente
                  </button>
                ) : (
                  <button
                    onClick={() => restartSession(session.id)}
                    title="Reconecta o cliente WhatsApp. Dados preservados."
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-200 transition-colors duration-200"
                  >
                    Reconectar
                  </button>
                )}
                <button
                  onClick={() => confirmRemoveSession(session.id)}
                  title="Remove a sessão e TODOS os dados (conversas, contatos, mensagens)"
                  className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 transition-colors duration-200"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Painel de Debug do Socket (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Debug do Socket
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <p className="font-medium text-gray-700">Status da Conexão</p>
              <p
                className={`text-lg font-bold ${
                  socketConnected ? "text-green-600" : "text-red-600"
                }`}
              >
                {socketConnected ? "✅ Conectado" : "❌ Desconectado"}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="font-medium text-gray-700">Sessões Ativas</p>
              <p className="text-lg font-bold text-blue-600">
                {sessions.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
