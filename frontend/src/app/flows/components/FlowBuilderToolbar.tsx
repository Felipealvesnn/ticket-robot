"use client";

import { useFlowsStore } from "@/store";
import dagre from "dagre";
import {
  Download,
  FileText,
  Grid3X3,
  Layers,
  Maximize,
  Play,
  Redo,
  Save,
  Undo,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useReactFlow } from "reactflow";

export const FlowBuilderToolbar = () => {
  const {
    currentFlow,
    saveCurrentFlow,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
  } = useFlowsStore();
  const { zoomIn, zoomOut, fitView, getNodes, getEdges, setNodes, setEdges } =
    useReactFlow();

  // Auto layout usando dagre
  const getLayoutedElements = (
    nodes: any[],
    edges: any[],
    direction = "TB"
  ) => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: direction,
      nodesep: 150,
      ranksep: 100,
      marginx: 50,
      marginy: 50,
    });

    // Definir tamanhos baseados no tipo de nó
    nodes.forEach((node) => {
      const width = node.data?.type === "condition" ? 250 : 200;
      const height = node.data?.type === "condition" ? 120 : 80;
      g.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      const width = node.data?.type === "condition" ? 250 : 200;
      const height = node.data?.type === "condition" ? 120 : 80;

      return {
        ...node,
        position: {
          x: nodeWithPosition.x - width / 2,
          y: nodeWithPosition.y - height / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
  };

  const handleFitView = () => {
    fitView({ duration: 500, padding: 0.2 });
  };

  const handleAutoLayout = () => {
    if (nodes.length === 0) {
      console.log("Nenhum nó disponível para organizar");
      return;
    }

    console.log("Organizando automaticamente os nós...");

    try {
      const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges);

      // Usar setNodes do ReactFlow diretamente
      setNodes(layoutedNodes);

      // Ajustar visualização após o layout
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 200);

      console.log("Layout automático aplicado com sucesso!");
    } catch (error) {
      console.error("Erro ao aplicar layout automático:", error);
    }
  };

  const handleUndo = () => {
    // Implementar undo com estado local por enquanto
    console.log("Funcionalidade de Undo será implementada");
  };

  const handleRedo = () => {
    // Implementar redo com estado local por enquanto
    console.log("Funcionalidade de Redo será implementada");
  };

  const handleToggleGrid = () => {
    // Alternar exibição da grade
    console.log("Alternar grade - será implementado");
  };

  const handlePreview = () => {
    // Abrir modal de preview
    console.log("Preview");
  };

  const handleExportFlow = () => {
    if (currentFlow) {
      const dataStr = JSON.stringify(currentFlow, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `${currentFlow.name}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleImportFlow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const flowData = JSON.parse(e.target?.result as string);
            console.log("Import flow:", flowData);
            // Implementar importação
          } catch (error) {
            console.error("Erro ao importar flow:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section - Flow Actions */}
        <div className="flex items-center space-x-1">
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1 pr-2 border-r border-gray-200">
            <button
              onClick={handleUndo}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-50 cursor-not-allowed"
              title="Desfazer (Em desenvolvimento)"
              disabled
            >
              <Undo size={16} />
            </button>
            <button
              onClick={handleRedo}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-50 cursor-not-allowed"
              title="Refazer (Em desenvolvimento)"
              disabled
            >
              <Redo size={16} />
            </button>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-1 px-2 border-r border-gray-200">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Diminuir zoom"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleFitView}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Ajustar visualização"
            >
              <Maximize size={16} />
            </button>
          </div>

          {/* Layout */}
          <div className="flex items-center space-x-1 px-2">
            <button
              onClick={handleAutoLayout}
              className={`p-2 rounded-lg transition-colors ${
                nodes.length > 0
                  ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              title={
                nodes.length > 0
                  ? "Organizar automaticamente"
                  : "Nenhum nó para organizar"
              }
              disabled={nodes.length === 0}
            >
              <Layers size={16} />
            </button>
            <button
              onClick={handleToggleGrid}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Alternar grade (Em desenvolvimento)"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>

        {/* Center Section - Flow Info */}
        <div className="flex items-center space-x-4">
          {currentFlow && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {currentFlow.nodes?.length || 0}
              </span>{" "}
              nós
              <span className="mx-2">•</span>
              <span className="font-medium">
                {currentFlow.edges?.length || 0}
              </span>{" "}
              conexões
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Import/Export */}
          <div className="flex items-center space-x-1 pr-2 border-r border-gray-200">
            <button
              onClick={handleImportFlow}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Importar flow"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button
              onClick={handleExportFlow}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Exportar flow"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>

          {/* Preview */}
          <button
            onClick={handlePreview}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play size={16} />
            <span>Preview</span>
          </button>

          {/* Save */}
          <button
            onClick={saveCurrentFlow}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={16} />
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
