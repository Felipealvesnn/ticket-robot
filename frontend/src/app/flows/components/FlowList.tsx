"use client";

import { useFlowsStore } from "@/store/flows";
import { Badge, Button, Card } from "flowbite-react";

interface FlowListProps {
  onEditFlow: (flowId: string) => void;
}

export default function FlowList({ onEditFlow }: FlowListProps) {
  const { flows, deleteFlow, duplicateFlow, updateFlow, currentFlow } =
    useFlowsStore();

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
    <div className="space-y-4 p-4">
      {flows.map((flow) => {
        const isSelected = currentFlow?.id === flow.id;
        return (
          <Card
            key={flow.id}
            className={`hover:shadow-lg transition-all cursor-pointer ${
              isSelected
                ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                : ""
            }`}
            onClick={() => onEditFlow(flow.id)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">
                  {flow.name}
                </h3>
                <Badge color={getStatusColor(flow.isActive)} size="xs">
                  {getStatusText(flow.isActive)}
                </Badge>
              </div>

              {flow.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {flow.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nós:</span>
                  <span className="font-medium">{flow.nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Conexões:</span>
                  <span className="font-medium">{flow.edges.length}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Atualizado:{" "}
                {new Date(flow.updatedAt).toLocaleDateString("pt-BR")}
              </div>

              {/* Triggers Tags */}
              {flow.triggers.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-1">
                    {flow.triggers.slice(0, 2).map((trigger, index) => (
                      <Badge key={index} color="info" size="xs">
                        {trigger}
                      </Badge>
                    ))}
                    {flow.triggers.length > 2 && (
                      <Badge color="gray" size="xs">
                        +{flow.triggers.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 space-y-2">
                {" "}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFlow(flow.id);
                  }}
                  color="blue"
                  size="xs"
                  className="w-full"
                >
                  Editar
                </Button>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateFlow(flow.id);
                    }}
                    color="gray"
                    size="xs"
                  >
                    Duplicar
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFlow(flow.id);
                    }}
                    color="failure"
                    size="xs"
                  >
                    Excluir
                  </Button>
                </div>{" "}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFlowStatus(flow.id, flow.isActive);
                  }}
                  color={flow.isActive ? "warning" : "success"}
                  size="xs"
                  className="w-full"
                >
                  {flow.isActive ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {flows.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-400"
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
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Nenhum flow criado
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Crie seu primeiro flow de chatbot
          </p>
        </div>
      )}
    </div>
  );
}
