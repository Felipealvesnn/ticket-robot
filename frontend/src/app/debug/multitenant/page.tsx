"use client";

import { socketService } from "@/services/socket";
import { useAuthStore } from "@/store/auth";
import { useSocketStore } from "@/store/socket";
import { useState } from "react";

export default function MultiTenantDebugPage() {
  const { user, currentCompanyId, setCurrentCompany } = useAuthStore();
  const { activeSessions, sessionStatuses, joinSession, leaveSession } =
    useSocketStore();
  const [testSessionId, setTestSessionId] = useState("test-session-123");

  const companies = user?.companies || [];
  const currentCompany = user?.currentCompany;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Debug Multi-Tenancy Socket.IO
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Usuário e Empresas */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              👤 Usuário e Empresas
            </h2>

            {user ? (
              <div className="space-y-4">
                <div>
                  <strong>Usuário:</strong> {user.name} ({user.email})
                </div>

                <div>
                  <strong>Empresa Atual:</strong>{" "}
                  {currentCompany?.name || "Nenhuma"}
                  <div className="text-sm text-gray-600">
                    ID: {currentCompanyId || "null"}
                  </div>
                </div>
                <div>
                  <strong>Empresas Disponíveis ({companies.length}):</strong>
                  {companies.length <= 1 ? (
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded">
                      <div className="text-sm text-gray-600">
                        {companies.length === 0
                          ? "Nenhuma empresa associada"
                          : "Usuário tem apenas uma empresa - troca não disponível"}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {companies.map((company) => (
                        <div
                          key={company.id}
                          className={`p-3 border rounded ${
                            company.id === currentCompanyId
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-600">
                            Role: {company.role.name} | ID: {company.id}
                          </div>
                          {company.id !== currentCompanyId && (
                            <button
                              onClick={() => setCurrentCompany(company.id)}
                              className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Trocar para esta empresa (TODO)
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Usuário não logado</p>
            )}
          </div>

          {/* Status do Socket.IO */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🔌 Status Socket.IO</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Conectado:</span>
                <span
                  className={`font-bold ${
                    socketService.isConnected()
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {socketService.isConnected() ? "✅ Sim" : "❌ Não"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Sessões Ativas:</span>
                <span className="font-bold">{activeSessions.length}</span>
              </div>

              <div>
                <strong>Salas Esperadas:</strong>
                <div className="text-sm text-gray-600 mt-1">
                  {activeSessions.map((sessionId) => (
                    <div key={sessionId}>
                      company-{currentCompanyId}-session-{sessionId}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Teste de Sessões */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🧪 Teste de Sessões</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  ID da Sessão de Teste:
                </label>
                <input
                  type="text"
                  value={testSessionId}
                  onChange={(e) => setTestSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="test-session-123"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => joinSession(testSessionId)}
                  disabled={!socketService.isConnected()}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Entrar na Sessão
                </button>

                <button
                  onClick={() => leaveSession(testSessionId)}
                  disabled={!socketService.isConnected()}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Sair da Sessão
                </button>
              </div>

              {sessionStatuses[testSessionId] && (
                <div className="p-3 bg-gray-50 rounded">
                  <strong>Status da Sessão:</strong>
                  <pre className="text-sm mt-1">
                    {JSON.stringify(sessionStatuses[testSessionId], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Logs em Tempo Real */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">📝 Logs Importantes</h2>

            <div className="text-sm space-y-2">
              <div>
                <strong>📋 Abra o DevTools Console</strong> para ver:
              </div>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>🔐 Autenticação JWT no Socket.IO</li>
                <li>🏢 Salas criadas por empresa</li>
                <li>📱 Join/Leave de sessões</li>
                <li>🔄 Eventos recebidos</li>
              </ul>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <strong>🚧 Funcionalidades TODO:</strong>
              <ul className="text-sm mt-2 space-y-1">
                <li>
                  • Troca de empresa (apenas se usuário tiver &gt; 1 empresa)
                </li>
                <li>• Reconexão automática ao trocar empresa</li>
                <li>• Validação de sessão vs empresa no backend</li>
                <li>• UI para seletor de empresa na aplicação principal</li>
              </ul>

              {companies.length > 1 && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <strong>
                    💡 Este usuário tem {companies.length} empresas
                  </strong>
                  <div className="text-xs mt-1">
                    A funcionalidade de troca estará disponível quando
                    implementada
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sessões Ativas */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">📱 Sessões Ativas</h2>

            {activeSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSessions.map((sessionId) => (
                  <div
                    key={sessionId}
                    className="border border-gray-200 rounded p-4"
                  >
                    <div className="font-medium">Sessão: {sessionId}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Sala: company-{currentCompanyId}-session-{sessionId}
                    </div>

                    {sessionStatuses[sessionId] && (
                      <div className="mt-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            sessionStatuses[sessionId].status === "connected"
                              ? "bg-green-100 text-green-800"
                              : sessionStatuses[sessionId].status ===
                                "connecting"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sessionStatuses[sessionId].status}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => leaveSession(sessionId)}
                      className="mt-2 w-full bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600"
                    >
                      Sair da Sessão
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma sessão ativa</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
