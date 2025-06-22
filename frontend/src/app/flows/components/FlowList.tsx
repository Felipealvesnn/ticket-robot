"use client";

import { useFlowsStore } from "@/store/flows";
import { Badge, Button, Card } from "flowbite-react";

interface FlowListProps {
  onEditFlow: (flowId: string) => void;
}

export default function FlowList({ onEditFlow }: FlowListProps) {
  const { flows, deleteFlow, duplicateFlow, updateFlow } = useFlowsStore();

  // Debug: verificar quantos flows estão sendo carregados
  console.log(
    "Flows carregados:",
    flows.length,
    flows.map((f) => ({ id: f.id, name: f.name, nodes: f.nodes?.length || 0 }))
  );
  const getStatusColor = (isActive: boolean): "success" | "gray" => {
    return isActive ? "success" : "gray";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Ativo" : "Inativo";
  };

  const toggleFlowStatus = (flowId: string, currentStatus: boolean) => {
    updateFlow(flowId, { isActive: !currentStatus });
  };

  const handleDeleteFlow = (flowId: string) => {
    if (confirm("Tem certeza que deseja excluir este flow?")) {
      deleteFlow(flowId);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {flows.map((flow) => (
        <Card key={flow.id}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {flow.name}
            </h3>
            <Badge color={getStatusColor(flow.isActive)}>
              {getStatusText(flow.isActive)}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {flow.description}
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nós:</span>
              <span className="text-gray-900 font-medium">
                {flow.nodes.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Conexões:</span>
              <span className="text-gray-900 font-medium">
                {flow.edges.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Triggers:</span>
              <span className="text-gray-900 font-medium">
                {flow.triggers.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Atualizado:</span>
              <span className="text-gray-900 font-medium">
                {new Date(flow.updatedAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Triggers Tags */}
          {flow.triggers.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">Palavras-chave:</p>
              <div className="flex flex-wrap gap-1">
                {flow.triggers.slice(0, 3).map((trigger, index) => (
                  <Badge key={index} color="info" size="sm">
                    {trigger}
                  </Badge>
                ))}
                {flow.triggers.length > 3 && (
                  <Badge color="gray" size="sm">
                    +{flow.triggers.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex space-x-2 mb-2">
              <Button
                onClick={() => onEditFlow(flow.id)}
                color="blue"
                size="sm"
                className="flex-1"
              >
                Editar
              </Button>
              <Button
                onClick={() => duplicateFlow(flow.id)}
                color="gray"
                size="sm"
                className="flex-1"
              >
                Duplicar
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => toggleFlowStatus(flow.id, flow.isActive)}
                color={flow.isActive ? "warning" : "success"}
                size="sm"
                className="flex-1"
              >
                {flow.isActive ? "Desativar" : "Ativar"}
              </Button>
              <Button
                onClick={() => handleDeleteFlow(flow.id)}
                color="failure"
                size="sm"
                className="flex-1"
              >
                Excluir
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {flows.length === 0 && (
        <div className="col-span-full text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum flow criado
          </h3>
          <p className="text-gray-600">
            Crie seu primeiro flow de chatbot para começar a automatizar
            conversas.
          </p>
        </div>
      )}
    </div>
  );
}
