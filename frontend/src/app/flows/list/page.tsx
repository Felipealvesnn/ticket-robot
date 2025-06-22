"use client";

import { useFlowsStore } from "@/store";
import {
  Calendar,
  Clock,
  Copy,
  Edit3,
  GitBranch,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FlowsListPage() {
  const router = useRouter();
  const {
    flows,
    createFlow,
    deleteFlow,
    duplicateFlow,
    updateFlow,
    setCurrentFlow,
  } = useFlowsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const handleCreateFlow = () => {
    if (newFlowName.trim()) {
      const newFlow = createFlow(newFlowName.trim(), newFlowDescription.trim());
      setShowCreateModal(false);
      setNewFlowName("");
      setNewFlowDescription("");

      // Usar setTimeout para garantir que o estado seja atualizado
      setTimeout(() => {
        setCurrentFlow(newFlow);
        router.push("/flows");
      }, 100);
    }
  };

  const handleEditFlow = (flowId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (flow) {
      setCurrentFlow(flow);
      router.push("/flows");
    }
  };

  const handleToggleActive = (flowId: string, isActive: boolean) => {
    updateFlow(flowId, { isActive: !isActive });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFlowStats = (flow: any) => {
    const nodeCount = flow.nodes?.length || 0;
    const edgeCount = flow.edges?.length || 0;
    const conditionNodes =
      flow.nodes?.filter((n: any) => n.data?.type === "condition").length || 0;

    return { nodeCount, edgeCount, conditionNodes };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Flows de Chatbot
              </h1>
              <p className="mt-2 text-gray-600">
                Gerencie e edite seus flows de conversação
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Flow
            </button>
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {flows.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum flow criado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando seu primeiro flow de chatbot.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Flow
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {flows.map((flow) => {
              const stats = getFlowStats(flow);

              return (
                <div
                  key={flow.id}
                  className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 w-3 h-3 rounded-full ${
                            flow.isActive ? "bg-green-400" : "bg-gray-400"
                          }`}
                        />
                        <h3 className="ml-3 text-lg font-medium text-gray-900 truncate">
                          {flow.name}
                        </h3>
                      </div>
                      <button
                        onClick={() =>
                          handleToggleActive(flow.id, flow.isActive)
                        }
                        className={`p-1 rounded-full ${
                          flow.isActive
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-50"
                        }`}
                        title={flow.isActive ? "Desativar flow" : "Ativar flow"}
                      >
                        {flow.isActive ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                      {flow.description || "Sem descrição"}
                    </p>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center text-gray-500">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {stats.nodeCount} nós
                      </div>
                      <div className="flex items-center text-gray-500">
                        <GitBranch className="w-4 h-4 mr-1" />
                        {stats.conditionNodes} condições
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {flow.triggers?.length || 0} gatilhos
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Criado: {formatDate(flow.createdAt)}
                      </div>
                      {flow.updatedAt !== flow.createdAt && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Atualizado: {formatDate(flow.updatedAt)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => handleEditFlow(flow.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar
                      </button>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => duplicateFlow(flow.id)}
                          className="p-2 border border-gray-300 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-50"
                          title="Duplicar flow"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFlow(flow.id)}
                          className="p-2 border border-gray-300 rounded-md text-red-400 hover:text-red-500 hover:bg-red-50"
                          title="Excluir flow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>{" "}
      {/* Create Flow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => {
                setShowCreateModal(false);
                setNewFlowName("");
                setNewFlowDescription("");
              }}
            ></div>

            {/* This element is to trick the browser into centering the modal contents. */}
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
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Criar Novo Flow
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="flow-name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Nome do Flow
                        </label>
                        <input
                          type="text"
                          id="flow-name"
                          value={newFlowName}
                          onChange={(e) => setNewFlowName(e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          placeholder="Ex: Atendimento ao Cliente"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="flow-description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Descrição (opcional)
                        </label>
                        <textarea
                          id="flow-description"
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
                  onClick={handleCreateFlow}
                  disabled={!newFlowName.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Flow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewFlowName("");
                    setNewFlowDescription("");
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {" "}
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
