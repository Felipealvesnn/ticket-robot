"use client";

import FlowEditor from "@/app/flows/components/FlowEditor";
import FlowList from "@/app/flows/components/FlowList";
import { useFlowsStore } from "@/store/flows";
import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Textarea,
} from "flowbite-react";
import { useState } from "react";

export default function FlowsPage() {
  const {
    currentFlow,
    flows,
    createFlow,
    setCurrentFlow,
    isLoading,
    error,
    resetToDefaultFlows,
    clearCacheAndReload,
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {view === "list" ? (
          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Flows do ChatBot ({flows.length})
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Crie e gerencie fluxos de conversa automatizados para seu
                    bot
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      if (
                        confirm("Limpar cache do navegador e recarregar dados?")
                      ) {
                        clearCacheAndReload();
                      }
                    }}
                    color="red"
                    size="sm"
                  >
                    Limpar Cache
                  </Button>
                  <Button onClick={handleResetFlows} color="gray" size="sm">
                    Reset Flows
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Novo Flow
                  </Button>
                </div>
              </div>

              {error && (
                <Alert color="failure" className="mt-4">
                  {error}
                </Alert>
              )}
            </div>

            <FlowList onEditFlow={handleEditFlow} />
          </div>
        ) : (
          <div className="h-[calc(100vh-2rem)]">
            <FlowEditor onBack={handleBackToList} />
          </div>
        )}

        {/* Modal para Novo Flow */}
        <Modal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          size="md"
        >
          <ModalHeader>Criar Novo Flow</ModalHeader>

          <ModalBody>
            <div className="space-y-4">
              <div>
                <Label htmlFor="flowName">Nome do Flow</Label>
                <TextInput
                  id="flowName"
                  type="text"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="Ex: Atendimento Vendas"
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <Label htmlFor="flowDescription">Descrição</Label>
                <Textarea
                  id="flowDescription"
                  value={newFlowDescription}
                  onChange={(e) => setNewFlowDescription(e.target.value)}
                  placeholder="Descreva o propósito deste flow..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              color="gray"
              onClick={() => {
                setShowCreateModal(false);
                setNewFlowName("");
                setNewFlowDescription("");
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateFlow}
              disabled={isLoading || !newFlowName.trim()}
            >
              {isLoading ? "Criando..." : "Criar Flow"}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
}
