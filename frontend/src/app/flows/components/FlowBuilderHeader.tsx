"use client";

import { useFlowsStore } from "@/store";
import {
  ArrowLeft,
  BarChart3,
  Check,
  MoreHorizontal,
  Play,
  Plus,
  Save,
  Settings,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const FlowBuilderHeader = () => {
  const router = useRouter();
  const { currentFlow, saveCurrentFlow, createFlow, setCurrentFlow } =
    useFlowsStore();
  const [showNewFlowModal, setShowNewFlowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  const handleBackToList = () => {
    router.push("/flows/list");
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await saveCurrentFlow();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("idle");
      console.error("Erro ao salvar:", error);
    }
  };

  const handleCreateNewFlow = () => {
    if (newFlowName.trim()) {
      const newFlow = createFlow(newFlowName.trim(), newFlowDescription.trim());
      setCurrentFlow(newFlow);
      setShowNewFlowModal(false);
      setNewFlowName("");
      setNewFlowDescription("");
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Navigation and Flow Info */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToList}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Voltar à lista de flows"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Flows</span>
            </button>

            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Flow Builder
              </h1>
            </div>

            {currentFlow && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">•</span>
                <h2 className="text-lg font-medium text-gray-700">
                  {currentFlow.name}
                </h2>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    currentFlow.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {currentFlow.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
            )}
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-3">
            {/* New Flow */}
            <button
              onClick={() => setShowNewFlowModal(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Flow</span>
            </button>

            {/* Analytics */}
            <button
              onClick={() => console.log("Analytics clicked")}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            {/* Test Flow */}
            <button
              onClick={() => console.log("Test clicked")}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Testar</span>
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                saveStatus === "saved"
                  ? "text-green-700 bg-green-100"
                  : saveStatus === "saving"
                  ? "text-gray-500 bg-gray-100 cursor-not-allowed"
                  : "text-white bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saveStatus === "saved" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {saveStatus === "saving"
                  ? "Salvando..."
                  : saveStatus === "saved"
                  ? "Salvo"
                  : "Salvar"}
              </span>
            </button>

            {/* Settings */}
            <button
              onClick={() => console.log("Settings clicked")}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* More Options */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* New Flow Modal */}
      {showNewFlowModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Criar Novo Flow
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="new-flow-name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Nome do Flow
                        </label>
                        <input
                          type="text"
                          id="new-flow-name"
                          value={newFlowName}
                          onChange={(e) => setNewFlowName(e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          placeholder="Ex: Novo Atendimento"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleCreateNewFlow()
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="new-flow-description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Descrição (opcional)
                        </label>
                        <textarea
                          id="new-flow-description"
                          rows={3}
                          value={newFlowDescription}
                          onChange={(e) =>
                            setNewFlowDescription(e.target.value)
                          }
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          placeholder="Descreva o propósito deste flow..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateNewFlow}
                  disabled={!newFlowName.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Flow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFlowModal(false);
                    setNewFlowName("");
                    setNewFlowDescription("");
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
