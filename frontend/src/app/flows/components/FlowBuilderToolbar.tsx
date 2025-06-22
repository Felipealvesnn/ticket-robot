"use client";

import { useFlowsStore } from "@/store";
import {
  Copy,
  Download,
  Eye,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Save,
  Play,
  Settings,
  FileText,
  Layers,
  Grid3X3,
} from "lucide-react";

export const FlowBuilderToolbar = () => {
  const { currentFlow, saveCurrentFlow } = useFlowsStore();

  const handleZoomIn = () => {
    // Implementar zoom in
    console.log("Zoom in");
  };

  const handleZoomOut = () => {
    // Implementar zoom out
    console.log("Zoom out");
  };

  const handleFitView = () => {
    // Implementar fit view
    console.log("Fit view");
  };

  const handleUndo = () => {
    // Implementar undo
    console.log("Undo");
  };

  const handleRedo = () => {
    // Implementar redo
    console.log("Redo");
  };

  const handlePreview = () => {
    // Abrir modal de preview
    console.log("Preview");
  };

  const handleExportFlow = () => {
    if (currentFlow) {
      const dataStr = JSON.stringify(currentFlow, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${currentFlow.name}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleImportFlow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const flowData = JSON.parse(e.target?.result as string);
            console.log('Import flow:', flowData);
            // Implementar importação
          } catch (error) {
            console.error('Erro ao importar flow:', error);
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
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Desfazer"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={handleRedo}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refazer"
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
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Organizar automaticamente"
            >
              <Layers size={16} />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Grade"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>

        {/* Center Section - Flow Info */}
        <div className="flex items-center space-x-4">
          {currentFlow && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{currentFlow.nodes?.length || 0}</span> nós
              <span className="mx-2">•</span>
              <span className="font-medium">{currentFlow.edges?.length || 0}</span> conexões
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
