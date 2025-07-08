"use client";

import { useRealtime } from "@/hooks/useRealtime";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  tickets: any[];
}

export default function EmptyState({ tickets }: EmptyStateProps) {
  const realtime = useRealtime();

  return (
    <div className="flex-1 flex items-center justify-center text-center bg-gray-50">
      <div className="max-w-md p-8">
        <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <ChatBubbleLeftRightIcon className="w-10 h-10 text-blue-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Selecione um ticket
        </h3>
        <p className="text-gray-500 mb-6">
          Escolha um ticket da lista para iniciar ou continuar a conversa
        </p>

        {/* Status do sistema */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-left">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Status do Sistema
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tempo real:</span>
              <span
                className={`font-medium flex items-center ${
                  realtime.isConnected ? "text-green-600" : "text-red-600"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    realtime.isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                {realtime.isConnected ? "Conectado" : "Desconectado"}
                {!realtime.isConnected && realtime.error && (
                  <span className="ml-1 text-xs">({realtime.error})</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Sessões ativas:</span>
              <span className="font-medium text-blue-600">
                {realtime.connectedSessions}/{realtime.totalSessions}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total de tickets:</span>
              <span className="font-medium text-gray-900">
                {tickets.length}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tickets abertos:</span>
              <span className="font-medium text-green-600">
                {tickets.filter((t) => t.status === "OPEN").length}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Em progresso:</span>
              <span className="font-medium text-blue-600">
                {tickets.filter((t) => t.status === "IN_PROGRESS").length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
