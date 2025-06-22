"use client";

import { useCallback, useState } from "react";
import { HiListBullet, HiPlus, HiSquares2X2 } from "react-icons/hi2";
import { Node } from "reactflow";

import { useFlowsStore } from "@/store/flows";

// Componentes
import {
  CreateFlowModal,
  EditNodeModal,
  ElementsPanel,
  FlowCanvas,
  FlowsPanel,
  PropertiesPanel,
  TemplatesPanel,
} from "./components";

import "reactflow/dist/style.css";

export default function FlowBuilderPage() {
  // Store do Zustand
  const { nodes, selectedNodeId, setSelectedNode } = useFlowsStore();

  // Estados da UI
  const [leftPanel, setLeftPanel] = useState<
    "flows" | "templates" | "elements"
  >("flows");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");

  // Estados do editor de nó
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeMessage, setNodeMessage] = useState("");
  const [nodeCondition, setNodeCondition] = useState("");
  const [nodeAction, setNodeAction] = useState("");

  // Callbacks do ReactFlow
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      if (node.data) {
        setNodeLabel(node.data.label || "");
        setNodeMessage(node.data.message || "");
        setNodeCondition(node.data.condition || "");
        setNodeAction(node.data.action || "");
      }
    },
    [setSelectedNode]
  );

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  const renderLeftPanelContent = () => {
    switch (leftPanel) {
      case "flows":
        return (
          <FlowsPanel onShowCreateModal={() => setShowCreateModal(true)} />
        );
      case "templates":
        return <TemplatesPanel />;
      case "elements":
        return <ElementsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Painel Esquerdo */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Tabs do painel esquerdo */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setLeftPanel("flows")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanel === "flows"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <HiListBullet className="w-4 h-4 inline mr-2" />
            Flows
          </button>
          <button
            onClick={() => setLeftPanel("templates")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanel === "templates"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <HiSquares2X2 className="w-4 h-4 inline mr-2" />
            Templates
          </button>
          <button
            onClick={() => setLeftPanel("elements")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanel === "elements"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <HiPlus className="w-4 h-4 inline mr-2" />
            Elementos
          </button>
        </div>

        {/* Conteúdo do painel esquerdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderLeftPanelContent()}
        </div>
      </div>

      {/* Canvas Principal */}
      <FlowCanvas
        onNodeClick={onNodeClick}
        onSetLeftPanel={setLeftPanel}
        onShowCreateModal={() => setShowCreateModal(true)}
      />

      {/* Painel Direito - Propriedades */}
      <PropertiesPanel
        selectedNode={selectedNode}
        onShowNodeModal={() => setShowNodeModal(true)}
      />

      {/* Modais */}
      <CreateFlowModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        newFlowName={newFlowName}
        setNewFlowName={setNewFlowName}
        newFlowDescription={newFlowDescription}
        setNewFlowDescription={setNewFlowDescription}
      />

      <EditNodeModal
        show={showNodeModal}
        onClose={() => setShowNodeModal(false)}
        selectedNode={selectedNode}
        nodeLabel={nodeLabel}
        setNodeLabel={setNodeLabel}
        nodeMessage={nodeMessage}
        setNodeMessage={setNodeMessage}
        nodeCondition={nodeCondition}
        setNodeCondition={setNodeCondition}
        nodeAction={nodeAction}
        setNodeAction={setNodeAction}
      />
    </div>
  );
}
