"use client";

import { useState } from "react";
import { useFlowsStore } from "@/store/flows";
import FlowEditor from "@/app/flows/components/FlowEditor";
import FlowList from "@/app/flows/components/FlowList";

export default function FlowsPage() {
  const {
    currentFlow,
    flows,
    createFlow,
    setCurrentFlow,
    isLoading,
    error,
    resetToDefaultFlows,
  } = useFlowsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const [view, setView] = useState<"list" | "editor">("list");

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) return;

    createFlow(newFlowName, newFlowDescription);
    setNewFlowName("");
    setNewFlowDescription("");
    setShowCreateModal(false);
    setView("editor");
  };

  const handleEditFlow = (flowId: string) => {
    "debugger";
    const flow = flows.find((f) => f.id === flowId);
    if (flow) {
      setCurrentFlow(flow);
      setView("editor");
    }
  };

  const handleBackToList = () => {
    setCurrentFlow(null);
    setView("list");
  };

  const handleResetFlows = () => {
    if (
      confirm(
        "Tem certeza que deseja resetar todos os flows para os padrões? Isso irá apagar todos os flows personalizados."
      )
    ) {
      resetToDefaultFlows();
    }
  };
  return (
    <div className="h-full flex flex-col p-3">
      {view === "list" ? (
        <div className="flex-1">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {" "}
              <div>
                {" "}
                <h1 className="text-3xl font-bold text-gray-900">
                  Flows do ChatBot ({flows.length})
                </h1>
                <p className="text-gray-600 mt-2">
                  Crie e gerencie fluxos de conversa automatizados para seu bot
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleResetFlows}
                  className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm"
                >
                  Reset Flows
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  Novo Flow
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
          {/* Modal para Novo Flow */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Criar Novo Flow
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Flow
                  </label>
                  <input
                    type="text"
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Atendimento Vendas"
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newFlowDescription}
                    onChange={(e) => setNewFlowDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva o propósito deste flow..."
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateFlow}
                    disabled={isLoading || !newFlowName.trim()}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isLoading ? "Criando..." : "Criar Flow"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewFlowName("");
                      setNewFlowDescription("");
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
          <FlowList onEditFlow={handleEditFlow} />{" "}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <FlowEditor onBack={handleBackToList} />
        </div>
      )}
    </div>
  );
}
