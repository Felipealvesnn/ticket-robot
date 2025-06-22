"use client";

import { useFlowsStore } from "@/store/flows";
import { Button } from "flowbite-react";
import { HiCog6Tooth, HiTrash } from "react-icons/hi2";
import { Node } from "reactflow";

interface PropertiesPanelProps {
  selectedNode: Node | undefined;
  onShowNodeModal: () => void;
}

export default function PropertiesPanel({
  selectedNode,
  onShowNodeModal,
}: PropertiesPanelProps) {
  const { deleteNode, selectedNodeId } = useFlowsStore();

  if (!selectedNode) {
    return null;
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Propriedades do Nó</h3>
        <p className="text-sm text-gray-600 capitalize">
          {selectedNode.data.type}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Button onClick={onShowNodeModal} className="w-full">
          <HiCog6Tooth className="w-4 h-4 mr-2" />
          Editar Nó
        </Button>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Informações</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Título:</span>{" "}
              {selectedNode.data.label}
            </div>
            {selectedNode.data.message && (
              <div>
                <span className="font-medium">Mensagem:</span>
                <p className="text-gray-600 mt-1 text-xs bg-gray-50 p-2 rounded">
                  {selectedNode.data.message}
                </p>
              </div>
            )}
            {selectedNode.data.condition && (
              <div>
                <span className="font-medium">Condição:</span>
                <p className="text-gray-600 mt-1 text-xs bg-gray-50 p-2 rounded">
                  {selectedNode.data.condition}
                </p>
              </div>
            )}
            {selectedNode.data.action && (
              <div>
                <span className="font-medium">Ação:</span>
                <p className="text-gray-600 mt-1 text-xs bg-gray-50 p-2 rounded">
                  {selectedNode.data.action}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <Button
            color="failure"
            size="sm"
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir este nó?")) {
                deleteNode(selectedNodeId!);
              }
            }}
            className="w-full"
          >
            <HiTrash className="w-4 h-4 mr-2" />
            Excluir Nó
          </Button>
        </div>
      </div>
    </div>
  );
}
