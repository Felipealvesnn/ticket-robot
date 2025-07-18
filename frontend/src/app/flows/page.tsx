"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

// Hooks
import { useFlowUndo } from "@/hooks/useFlowUndo";

// Componentes do Flow Builder
import { CustomNode } from "./components/CustomNode";
import { EdgeContextMenu } from "./components/EdgeContextMenu";
import { ElementsPalette } from "./components/ElementsPalette";
import { FlowBuilderHeader } from "./components/FlowBuilderHeader";
import { FlowValidationPanel } from "./components/FlowValidationPanel";

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
  menu: CustomNode,
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
    loadFlowsFromApi,
    isLoading,
  } = useFlowsStore();

  // Carregar flows do backend automaticamente
  useEffect(() => {
    const loadFlows = async () => {
      try {
        await loadFlowsFromApi();
      } catch (error) {
        console.error("Erro ao carregar flows:", error);
      }
    };

    // Só carregar se não há flows carregados
    if (flows.length === 0 && !isLoading) {
      loadFlows();
    }
  }, [flows.length, isLoading, loadFlowsFromApi]);

  // Redirecionar para lista de flows se não há flow selecionado
  useEffect(() => {
    // Dar tempo para o Zustand sincronizar o estado
    const timer = setTimeout(() => {
      if (!currentFlow) {
        if (flows.length > 0) {
          // Se há flows mas nenhum selecionado, redirecionar para lista
          router.push("/flows/list");
        } else {
          // Se não há flows, redirecionar para lista (que carregará dados)
          router.push("/flows/list");
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentFlow, flows, router]);

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

  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
}

// Componente interno que tem acesso ao ReactFlowProvider
function FlowBuilderContent() {
  const {
    currentFlow,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    addNode,
  } = useFlowsStore();

  // Estados para painel de validação
  const [isValidationPanelOpen, setIsValidationPanelOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    edgeId: string;
    x: number;
    y: number;
  } | null>(null);

  // Hook para undo/redo com auto-save (agora dentro do ReactFlowProvider)
  const { saveCurrentState } = useFlowUndo();

  // Handler para deletar conexão selecionada
  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge) {
      saveCurrentState(); // Salvar estado antes de deletar
      onEdgesChange([{ type: "remove", id: selectedEdge }]);
      setSelectedEdge(null);
    }
  }, [selectedEdge, onEdgesChange, saveCurrentState]);

  // Handler para pressionar Delete/Backspace
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedEdge
      ) {
        event.preventDefault();
        deleteSelectedEdge();
      }
      // Fechar menu contextual com Escape
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [selectedEdge, deleteSelectedEdge]);

  // Handler para clique direito nas edges
  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.preventDefault();
      setContextMenu({
        edgeId: edge.id,
        x: event.clientX,
        y: event.clientY,
      });
      setSelectedEdge(edge.id);
    },
    []
  );
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

  // Auto-save de estado após mudanças significativas
  useEffect(() => {
    if (nodes.length > 0) {
      const timeoutId = setTimeout(() => {
        saveCurrentState();
      }, 1000); // Salvar após 1 segundo de inatividade

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, saveCurrentState]);

  // Aplicar estilo visual às edges selecionadas
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      animated: edge.id === selectedEdge,
      style: {
        ...edge.style,
        stroke: edge.id === selectedEdge ? "#ef4444" : "#6b7280",
        strokeWidth: edge.id === selectedEdge ? 3 : 2,
        cursor: "pointer",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.id === selectedEdge ? "#ef4444" : "#6b7280",
        width: edge.id === selectedEdge ? 24 : 20,
        height: edge.id === selectedEdge ? 24 : 20,
      },
      selected: edge.id === selectedEdge,
    }));
  }, [edges, selectedEdge]);

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

    // Salvar estado antes de adicionar nó
    saveCurrentState();

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <FlowBuilderHeader />
      {/* Toolbar */}
      <FlowBuilderToolbar
        isValidationPanelOpen={isValidationPanelOpen}
        setIsValidationPanelOpen={setIsValidationPanelOpen}
      />{" "}
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Elements Palette */}
        <ElementsPalette onDragStart={onDragStart} />

        {/* Canvas Area */}
        <div className="flex-1 flex">
          {/* Delete Edge Instructions */}
          {selectedEdge && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-red-100 border border-red-300 rounded-lg px-4 py-2 shadow-lg animate-pulse">
              <div className="flex items-center gap-2 text-red-800">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="text-sm font-medium">
                  Conexão selecionada - Pressione{" "}
                  <kbd className="px-1.5 py-0.5 bg-red-200 rounded text-xs font-mono">
                    Delete
                  </kbd>{" "}
                  ou{" "}
                  <kbd className="px-1.5 py-0.5 bg-red-200 rounded text-xs font-mono ml-1">
                    Backspace
                  </kbd>{" "}
                  para deletar, ou clique direito para opções
                </span>
              </div>
            </div>
          )}

          {/* Flow Canvas */}
          <div
            className="flex-1 relative"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <ReactFlow
              nodes={nodes}
              edges={styledEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              onNodeClick={(_, node) => {
                setSelectedNode(node.id);
                setSelectedEdge(null); // Limpar seleção de edge ao clicar em nó
              }}
              onEdgeClick={(_, edge) => {
                setSelectedEdge(edge.id);
                setSelectedNode(null); // Limpar seleção de nó ao clicar em edge
              }}
              onPaneClick={() => {
                setSelectedNode(null);
                setSelectedEdge(null); // Limpar todas as seleções ao clicar no painel
                setContextMenu(null); // Fechar menu contextual
              }}
              onEdgeContextMenu={handleEdgeContextMenu}
              proOptions={{ hideAttribution: true }}
              className="bg-white"
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              minZoom={0.2}
              maxZoom={2}
              snapToGrid
              snapGrid={[20, 20]}
              // Customizar o estilo das edges
              defaultEdgeOptions={{
                type: "smoothstep",
                animated: false,
                style: {
                  stroke: "#6b7280",
                  strokeWidth: 2,
                  cursor: "pointer",
                },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: "#6b7280",
                  width: 20,
                  height: 20,
                },
              }}
              // Personalizar edges selecionadas
              edgesUpdatable={false}
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
      {/* Edge Context Menu */}
      {contextMenu && (
        <EdgeContextMenu
          edgeId={contextMenu.edgeId}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onDelete={deleteSelectedEdge}
          onClose={() => setContextMenu(null)}
        />
      )}
      {/* Modals */}
      <FlowBuilderModals />
      {/* Validation Panel */}
      <FlowValidationPanel
        nodes={nodes}
        edges={edges}
        isOpen={isValidationPanelOpen}
        onClose={() => setIsValidationPanelOpen(false)}
        onNodeSelect={(nodeId) => setSelectedNode(nodeId)}
      />
    </div>
  );
}
