"use client";

import { useState } from "react";
import { useSessionsStore } from "@/store/sessions";

export default function SessionsPage() {
  const { sessions, isLoading, error, addSession, connectSession, disconnectSession, removeSession } = useSessionsStore();
  const [newSessionName, setNewSessionName] = useState("");
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    
    await addSession(newSessionName);
    setNewSessionName("");
    setShowNewSessionForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sessões WhatsApp</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas conexões WhatsApp e visualize QR Codes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Card de Nova Sessão */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">➕</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nova Sessão
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Criar nova conexão WhatsApp
            </p>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Criar Sessão
            </button>
          </div>
        </div>

        {/* Sessões Existentes */}
        {[1, 2, 3].map((session) => (
          <div
            key={session}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Sessão #{session}
              </h3>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Conectado
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Criado em:</span>
                <span className="text-gray-900">19/06/2025</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mensagens hoje:</span>
                <span className="text-gray-900">
                  {Math.floor(Math.random() * 50)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors duration-200">
                  Gerenciar
                </button>
                <button className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 transition-colors duration-200">
                  Desconectar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
