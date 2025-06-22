"use client";

import { useFlowsStore } from "@/store/flows";
import { Button, Card } from "flowbite-react";
import {
  HiChatBubbleLeftRight,
  HiDocumentDuplicate,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";

interface FlowsPanelProps {
  onShowCreateModal: () => void;
}

export default function FlowsPanel({ onShowCreateModal }: FlowsPanelProps) {
  const { flows, currentFlow, setCurrentFlow, deleteFlow, duplicateFlow } =
    useFlowsStore();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Meus Flows</h3>
        <Button size="xs" onClick={onShowCreateModal}>
          <HiPlus className="w-4 h-4" />
        </Button>
      </div>

      {flows.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <HiChatBubbleLeftRight className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500 text-sm mb-4">Nenhum flow criado ainda</p>
          <Button onClick={onShowCreateModal} size="sm">
            Criar Primeiro Flow
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {flows.map((flow) => (
            <Card
              key={flow.id}
              className={`cursor-pointer transition-all ${
                currentFlow?.id === flow.id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:shadow-md"
              }`}
              onClick={() => setCurrentFlow(flow)}
            >
              <div className="p-3">
                <h4 className="font-medium text-gray-900">{flow.name}</h4>
                {flow.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {flow.description}
                  </p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <div className="flex space-x-4 text-xs text-gray-500">
                    <span>{flow.nodes.length} nós</span>
                    <span>{flow.edges.length} conexões</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="xs"
                      color="gray"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateFlow(flow.id);
                      }}
                    >
                      <HiDocumentDuplicate className="w-3 h-3" />
                    </Button>
                    <Button
                      size="xs"
                      color="failure"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm("Tem certeza que deseja excluir este flow?")
                        ) {
                          deleteFlow(flow.id);
                        }
                      }}
                    >
                      <HiTrash className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
