"use client";

import { useFlowsStore } from "@/store";
import { Settings, Trash2, X } from "lucide-react";
import { FC, useEffect, useState } from "react";
import {
  AdvancedTab,
  BasicTab,
  ConditionsTab,
  ConfigTab,
  ContactTab,
  getAvailableTabs,
  getNodeIcon,
  IntegrationTab,
  MediaTab,
  MenuTab,
  TabType,
  TimingTab,
} from "./flowPropertiesPanel";

export const FlowBuilderPropertiesPanel: FC = () => {
  const {
    selectedNodeId,
    nodes,
    edges,
    updateNodeData,
    deleteNode,
    addNodeWithConnection,
  } = useFlowsStore();

  const [activeTab, setActiveTab] = useState<TabType>("basic");

  // Todos os hooks devem ser chamados antes de qualquer return condicional
  const node = nodes.find((n: any) => n.id === selectedNodeId);
  const nodeType = node?.data?.type || "message";

  const availableTabs = getAvailableTabs(nodeType);

  // Ajustar aba ativa se não estiver disponível para este tipo de nó
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab("basic");
    }
  }, [nodeType, availableTabs, activeTab]);

  const nodeIcon = getNodeIcon(nodeType);

  // Renders condicionais DEPOIS de todos os hooks
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

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;

    if (
      confirm(
        "Tem certeza que deseja excluir este nó? Esta ação não pode ser desfeita."
      )
    ) {
      deleteNode(selectedNodeId);
    }
  };

  const getTabLabel = (tab: TabType): string => {
    const labels: Record<TabType, string> = {
      basic: "Básico",
      conditions: "Condições",
      config: "Configuração",
      integration: "Integração",
      timing: "Tempo",
      contact: "Contato",
      media: "Mídia",
      menu: "Menu",
      advanced: "Avançado",
    };
    return labels[tab];
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <BasicTab
            node={node}
            nodeType={nodeType}
            onUpdateProperty={handleUpdateProperty}
          />
        );

      case "conditions":
        return (
          <ConditionsTab
            node={node}
            nodes={nodes}
            onUpdateProperty={handleUpdateProperty}
            onAddNodeWithConnection={addNodeWithConnection}
          />
        );

      case "config":
        return (
          <ConfigTab
            node={node}
            nodeType={nodeType}
            onUpdateProperty={handleUpdateProperty}
          />
        );

      case "integration":
        return (
          <IntegrationTab
            node={node}
            nodeType={nodeType}
            onUpdateProperty={handleUpdateProperty}
          />
        );

      case "timing":
        return (
          <TimingTab node={node} onUpdateProperty={handleUpdateProperty} />
        );

      case "contact":
        return (
          <ContactTab
            node={node}
            nodeType={nodeType}
            onUpdateProperty={handleUpdateProperty}
          />
        );

      case "media":
        return (
          <MediaTab
            node={node}
            nodeType={nodeType}
            onUpdateProperty={handleUpdateProperty}
          />
        );

      case "menu":
        return (
          <MenuTab
            node={node}
            nodes={nodes}
            onUpdateProperty={handleUpdateProperty}
            onAddNodeWithConnection={addNodeWithConnection}
          />
        );

      case "advanced":
        return (
          <AdvancedTab node={node} onUpdateProperty={handleUpdateProperty} />
        );

      default:
        return <div>Aba não encontrada</div>;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Propriedades</h3>
        <div className="flex items-center gap-2">
          {/* Botão de deletar nó */}
          {nodeType !== "start" && (
            <button
              onClick={handleDeleteNode}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Excluir nó"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => useFlowsStore.getState().setSelectedNode(null)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }
              `}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Type Icon */}
        <div
          className={`flex items-center gap-3 p-3 ${nodeIcon.bg} rounded-lg`}
        >
          <nodeIcon.Icon size={20} className={nodeIcon.color} />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
            </div>
            <div className="text-xs text-gray-500">ID: {node.id}</div>
            {/* Indicador de mídia */}
            {(nodeType === "image" || nodeType === "file") &&
              node.data?.mediaId && (
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  ✅ <span>Mídia configurada</span>
                </div>
              )}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};
