"use client";

import { useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

// Componentes do Flow Builder
import { CustomNode } from "./components/CustomNode";
import { FlowBuilderHeader } from "./components/FlowBuilderHeader";
import { FlowBuilderSidebar } from "./components/FlowBuilderSidebar";

// Store
import { useFlowsStore } from "../../store";
import { FlowBuilderToolbar } from "./components/FlowBuilderToolbar";
import { FlowBuilderPropertiesPanel } from "./components/FlowBuilderPropertiesPanel";
import { FlowBuilderModals } from "./components/FlowBuilderModals";

// Registro do nó customizado
const nodeTypes = {
  custom: CustomNode,
};

export default function FlowBuilderPage() {
  const {
    flows,
    currentFlow,
    setCurrentFlow,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
  } = useFlowsStore();

  // Seleciona o primeiro flow ao abrir
  useEffect(() => {
    if (!currentFlow && flows.length > 0) {
      setCurrentFlow(flows[0]);
    }
  }, [currentFlow, flows, setCurrentFlow]);

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <FlowBuilderHeader />

        {/* Toolbar */}
        <FlowBuilderToolbar />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <FlowBuilderSidebar />

          {/* Canvas Area */}
          <div className="flex-1 flex">
            {/* Flow Canvas */}
            <div className="flex-1 relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                onNodeClick={(_, node) => setSelectedNode(node.id)}
                proOptions={{ hideAttribution: true }}
                className="bg-white"
              >
                <Background
                  variant={"dots" as any}
                  gap={20}
                  size={1}
                  color="#e5e7eb"
                />
                <MiniMap
                  nodeColor="#3b82f6"
                  position="bottom-right"
                  style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Controls
                  position="bottom-left"
                  style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </ReactFlow>
            </div>

            {/* Properties Panel */}
            <FlowBuilderPropertiesPanel />
          </div>
        </div>

        {/* Modals */}
        <FlowBuilderModals />
      </div>
    </ReactFlowProvider>
  );
}
