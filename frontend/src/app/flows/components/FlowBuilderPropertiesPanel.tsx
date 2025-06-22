"use client";

import { MessageSquare, Settings, X } from "lucide-react";
import { FC } from "react";
import { useFlowsStore } from "@/store";


export const FlowBuilderPropertiesPanel: FC = () => {
  const { selectedNodeId, nodes, updateNodeData } = useFlowsStore();
  if (!selectedNodeId) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 mt-8">
          <Settings size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Selecione um nó para editar suas propriedades</p>
        </div>
      </div>
    );
  }

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 mt-8">
          <p>Nó não encontrado</p>
        </div>
      </div>
    );
  }
  const handleUpdateProperty = (property: string, value: any) => {
    if (!selectedNodeId) return;
    updateNodeData(selectedNodeId, {
      [property]: value,
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Propriedades</h3>
        <button
          onClick={() => useFlowsStore.getState().setSelectedNode(null)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Type Icon */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <MessageSquare size={20} className="text-blue-600" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {node.type === "custom" ? "Nó Personalizado" : node.type}
            </div>
            <div className="text-xs text-gray-500">ID: {node.id}</div>
          </div>
        </div>
        {/* Basic Properties */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={node.data?.label || ""}
              onChange={(e) => handleUpdateProperty("label", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do nó"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={node.data?.description || ""}
              onChange={(e) =>
                handleUpdateProperty("description", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="Descrição do nó"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem
            </label>
            <textarea
              value={node.data?.message || ""}
              onChange={(e) => handleUpdateProperty("message", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="Digite a mensagem que será enviada..."
            />
          </div>
        </div>{" "}
        {/* Position */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Posição</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={Math.round(node.position.x)}
                readOnly
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(node.position.y)}
                readOnly
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
