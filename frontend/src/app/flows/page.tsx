"use client";

import { useRouter } from "next/navigation";
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
import { ElementsPalette } from "./components/ElementsPalette";
import { FlowBuilderHeader } from "./components/FlowBuilderHeader";

// Store
import { useFlowsStore } from "../../store";
import { FlowBuilderModals } from "./components/FlowBuilderModals";
import { FlowBuilderPropertiesPanel } from "./components/FlowBuilderPropertiesPanel";
import { FlowBuilderToolbar } from "./components/FlowBuilderToolbar";

// Registro dos nós customizados
const nodeTypes = {
  custom: CustomNode,
  message: CustomNode,
  condition: CustomNode,
  delay: CustomNode,
  image: CustomNode,
  file: CustomNode,
  start: CustomNode,
  end: CustomNode,
  webhook: CustomNode,
  database: CustomNode,
  calculation: CustomNode,
  email: CustomNode,
  phone: CustomNode,
  automation: CustomNode,
  segment: CustomNode,
  tag: CustomNode,
  transfer: CustomNode,
  ticket: CustomNode,
};

export default function FlowBuilderPage() {
  const router = useRouter();
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
    addNode,
  } = useFlowsStore();
  // Redirecionar para lista de flows se não há flow selecionado
  useEffect(() => {
    // Dar tempo para o Zustand sincronizar o estado
    const timer = setTimeout(() => {
      if (!currentFlow) {
        if (flows.length > 0) {
          // Se há flows mas nenhum selecionado, redirecionar para lista
          router.push("/flows/list");
        } else {
          // Se não há flows, selecionar o primeiro padrão ou redirecionar
          router.push("/flows/list");
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentFlow, flows, router]);
  // Carregar nodes e edges do flow atual
  useEffect(() => {
    if (currentFlow && currentFlow.nodes) {
      // Forçar sincronização dos nodes e edges para garantir que o React Flow tenha os dados corretos
      // Isso é importante especialmente quando um novo flow é criado
      const { flows, setCurrentFlow: updateFlow } = useFlowsStore.getState();
      const latestFlow = flows.find((f) => f.id === currentFlow.id);
      if (latestFlow) {
        updateFlow(latestFlow);
      }
    }
  }, [currentFlow]);

  // Se não há flow atual, mostrar loading
  if (!currentFlow) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando flow...</p>
        </div>
      </div>
    );
  }

  // Drag & Drop handlers
  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const nodeType = event.dataTransfer.getData("application/reactflow");

    if (typeof nodeType === "undefined" || !nodeType) {
      return;
    }

    const position = {
      x: event.clientX - 250, // Adjust for sidebar width
      y: event.clientY - 150, // Adjust for header height
    };

    addNode(nodeType as any, position);
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <FlowBuilderHeader />
        {/* Toolbar */}
        <FlowBuilderToolbar /> {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Elements Palette */}
          <ElementsPalette onDragStart={onDragStart} />

          {/* Canvas Area */}
          <div className="flex-1 flex">
            {/* Flow Canvas */}
            <div
              className="flex-1 relative"
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
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
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                minZoom={0.2}
                maxZoom={2}
                snapToGrid
                snapGrid={[20, 20]}
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
                    borderRadius: "8px",
                  }}
                />
                <Controls
                  position="bottom-left"
                  style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
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
