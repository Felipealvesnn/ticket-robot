"use client";

import { useFlowsStore } from "@/store/flows";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Textarea,
} from "flowbite-react";
import { useState } from "react";
import FlowList from "./components/FlowList";
import FlowWorkspace from "./components/FlowWorkspace";

export default function FlowsPage() {
  const {
    flows,
    currentFlow,
    setCurrentFlow,
    createFlow,
    clearCacheAndReload,
  } = useFlowsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Debug: verificar flows carregados
  console.log(
    "FlowsPage - flows:",
    flows.length,
    "currentFlow:",
    currentFlow?.name
  );

  const handleEditFlow = (flowId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (flow) {
      setCurrentFlow(flow);
    }
  };
  const handleCreateFlow = async () => {
    if (!newFlowName.trim() || isCreating) return;

    setIsCreating(true);

    try {
      createFlow(newFlowName, newFlowDescription);
      setNewFlowName("");
      setNewFlowDescription("");
      setShowCreateModal(false);

      // Pequeno delay para dar feedback visual
      setTimeout(() => {
        setIsCreating(false);
      }, 200);
    } catch (error) {
      console.error("Erro ao criar flow:", error);
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateFlow();
    }
  };

  return (
    <>
      <div className="h-screen flex bg-gray-50 overflow-hidden">
        {/* Sidebar com lista de flows */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Header da sidebar */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            {" "}
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold text-gray-900">
                🤖 Meus Flows
              </h1>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ➕ Novo
                </Button>
                <Button
                  size="sm"
                  color="gray"
                  onClick={clearCacheAndReload}
                  title="Limpar cache e recarregar"
                >
                  🔄
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {flows.length} flow{flows.length !== 1 ? "s" : ""} criado
              {flows.length !== 1 ? "s" : ""}
            </p>
          </div>{" "}
          {/* Lista de flows */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <FlowList onEditFlow={handleEditFlow} />
          </div>
        </div>

        {/* Workspace principal */}
        <div className="flex-1 min-w-0">
          <FlowWorkspace onCreateFlow={() => setShowCreateModal(true)} />
        </div>
      </div>{" "}
      {/* Modal de criar flow */}
      <Modal
        show={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewFlowName("");
          setNewFlowDescription("");
          setIsCreating(false);
        }}
        size="md"
      >
        <ModalHeader>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              🎨
            </div>
            <span>Criar Novo Flow</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Flow
              </label>{" "}
              <TextInput
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ex: Atendimento ao Cliente"
                required
                autoFocus
                className={
                  !newFlowName.trim() && newFlowName.length > 0
                    ? "border-red-300"
                    : ""
                }
              />
              {!newFlowName.trim() && newFlowName.length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Nome do flow é obrigatório
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <Textarea
                value={newFlowDescription}
                onChange={(e) => setNewFlowDescription(e.target.value)}
                placeholder="Descreva o propósito deste flow..."
                rows={3}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2">
            <Button color="gray" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>{" "}
            <Button
              onClick={handleCreateFlow}
              disabled={!newFlowName.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Criando...</span>
                </div>
              ) : (
                "Criar Flow"
              )}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
}
