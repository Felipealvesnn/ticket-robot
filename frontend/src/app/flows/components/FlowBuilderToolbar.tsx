"use client";

import { useAutoReturn } from "@/hooks/useAutoReturn";
import { useFlowUndo } from "@/hooks/useFlowUndo";
import { useFlowsStore } from "@/store";
import { FlowValidator, ValidationResult } from "@/utils/FlowValidator";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Grid3X3,
  Layers,
  Maximize,
  Play,
  Redo,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Undo,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useReactFlow } from "reactflow";
import { AutoReturnConfig } from "./AutoReturnConfig";
import { FlowValidationPanel } from "./FlowValidationPanel";

export const FlowBuilderToolbar = ({
  isValidationPanelOpen,
  setIsValidationPanelOpen,
}: {
  isValidationPanelOpen: boolean;
  setIsValidationPanelOpen: (open: boolean) => void;
}) => {
  const {
    currentFlow,
    saveCurrentFlow,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    autoLayoutEnabled,
    setAutoLayoutEnabled,
    applyAutoLayout,
  } = useFlowsStore();
  const { saveCurrentState, handleUndo, handleRedo, canUndo, canRedo } =
    useFlowUndo();
  const { zoomIn, zoomOut, fitView, getNodes, getEdges, setNodes, setEdges } =
    useReactFlow();

  // Auto Return Configuration
  const {
    strategy: autoReturnStrategy,
    updateStrategy: updateAutoReturnStrategy,
  } = useAutoReturn();
  const [showAutoReturnConfig, setShowAutoReturnConfig] = useState(false);

  // Estado para validação
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Salvar estado inicial quando o flow carrega
  useEffect(() => {
    if (currentFlow && nodes.length > 0) {
      saveCurrentState();
    }
  }, [currentFlow?.id, saveCurrentState]);

  // Validação automática quando os nós/edges mudam
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nodes.length > 0) {
        runQuickValidation();
      }
    }, 1000); // Debounce de 1 segundo

    return () => clearTimeout(timeoutId);
  }, [nodes, edges]);

  // Validação rápida para mostrar status no toolbar
  const runQuickValidation = () => {
    if (nodes.length === 0) {
      setValidationResult(null);
      return;
    }

    const validator = new FlowValidator(nodes, edges);
    const result = validator.validateFlow();
    setValidationResult(result);
  };

  // Validação completa com painel
  const handleFullValidation = () => {
    setIsValidating(true);
    setIsValidationPanelOpen(true);

    setTimeout(() => {
      setIsValidating(false);
    }, 300); // Simular processo de validação
  };

  // Salvar com validação
  const handleSaveWithValidation = async () => {
    setIsValidating(true);

    const validator = new FlowValidator(nodes, edges);
    const result = validator.validateFlow();

    setIsValidating(false);

    if (result.errors.length > 0) {
      setValidationResult(result);
      setIsValidationPanelOpen(true);
      toast.error(
        `Não é possível salvar: corrija ${result.errors.length} erro(s) antes de salvar`
      );
      return;
    }

    // Se não há erros críticos, mas há warnings, perguntar ao usuário
    if (result.warnings.length > 0) {
      const confirmSave = window.confirm(
        `O fluxo tem ${result.warnings.length} aviso(s) de melhoria. Deseja salvar mesmo assim?`
      );
      if (!confirmSave) {
        setValidationResult(result);
        setIsValidationPanelOpen(true);
        return;
      }
    }

    // Salvar fluxo
    await saveCurrentFlow();
    toast.success("Fluxo salvo com sucesso!");
  };

  // Navegar para nó com erro
  const handleNodeSelect = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      fitView({
        duration: 500,
        padding: 0.3,
        nodes: [{ id: nodeId }],
      });
      setIsValidationPanelOpen(false);
    }
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
      // Salvar estado antes de aplicar layout
      saveCurrentState();

      // Usar a função do store
      applyAutoLayout();

      // Ajustar visualização após o layout
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 200);

      toast.success("Layout aplicado com sucesso!");
      console.log("Layout automático aplicado com sucesso!");
    } catch (error) {
      console.error("Erro ao aplicar layout automático:", error);
      toast.error(
        "Erro no layout: não foi possível organizar os nós automaticamente"
      );
    }
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
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Flow Actions */}
          <div className="flex items-center space-x-1">
            {/* Undo/Redo */}
            <div className="flex items-center space-x-1 pr-2 border-r border-gray-200">
              <button
                onClick={handleUndo}
                className={`p-2 rounded-lg transition-colors ${
                  canUndo
                    ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                title={canUndo ? "Desfazer (Ctrl+Z)" : "Nada para desfazer"}
                disabled={!canUndo}
              >
                <Undo size={16} />
              </button>
              <button
                onClick={handleRedo}
                className={`p-2 rounded-lg transition-colors ${
                  canRedo
                    ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                title={canRedo ? "Refazer (Ctrl+Shift+Z)" : "Nada para refazer"}
                disabled={!canRedo}
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
            <div className="flex items-center space-x-1 px-2 border-r border-gray-200">
              <button
                onClick={handleAutoLayout}
                className={`p-2 rounded-lg transition-colors ${
                  nodes.length > 0
                    ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                title={
                  nodes.length > 0
                    ? "Organizar automaticamente agora"
                    : "Nenhum nó para organizar"
                }
                disabled={nodes.length === 0}
              >
                <Layers size={16} />
              </button>

              <button
                onClick={() => setAutoLayoutEnabled(!autoLayoutEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  autoLayoutEnabled
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                title={
                  autoLayoutEnabled
                    ? "Auto-layout ATIVO: Novos nós são organizados automaticamente"
                    : "Auto-layout INATIVO: Clique para ativar organização automática"
                }
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={handleToggleGrid}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Alternar grade (Em desenvolvimento)"
              >
                <Grid3X3 size={16} />
              </button>
            </div>

            {/* Validation */}
            <div className="flex items-center space-x-1 px-2">
              {/* Auto Return Config */}
              <button
                onClick={() => setShowAutoReturnConfig(true)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  autoReturnStrategy.enabled
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                title={
                  autoReturnStrategy.enabled
                    ? `Retorno automático ativo: ${autoReturnStrategy.type}`
                    : "Configurar retorno automático para nós sem próximo passo"
                }
              >
                <Settings size={16} />
                <span className="text-sm hidden md:inline">
                  {autoReturnStrategy.enabled ? "Auto Return" : "Manual"}
                </span>
              </button>

              <button
                onClick={() => setIsValidationPanelOpen(!isValidationPanelOpen)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isValidationPanelOpen
                    ? "text-blue-600 bg-blue-50"
                    : validationResult?.isValid === false
                    ? "text-red-600 bg-red-50 hover:bg-red-100"
                    : validationResult?.isValid === true
                    ? "text-green-600 bg-green-50 hover:bg-green-100"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                title={
                  isValidationPanelOpen
                    ? "Fechar painel de validação"
                    : "Abrir painel de validação"
                }
              >
                {validationResult?.isValid === false ? (
                  <AlertCircle size={16} />
                ) : validationResult?.isValid === true ? (
                  <CheckCircle size={16} />
                ) : (
                  <Shield size={16} />
                )}
                <span className="text-sm hidden sm:inline">
                  {validationResult?.isValid === false
                    ? `${validationResult.summary.criticalIssues} erros`
                    : validationResult?.isValid === true
                    ? "Válido"
                    : "Validar"}
                </span>
              </button>

              <button
                onClick={handleFullValidation}
                className={`p-2 rounded-lg transition-colors ${
                  isValidating
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                title="Executar validação completa"
                disabled={isValidating || nodes.length === 0}
              >
                {isValidating ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play size={16} />
                )}
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
                {validationResult && (
                  <>
                    <span className="mx-2">•</span>
                    <span
                      className={`font-medium ${
                        validationResult.isValid
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {validationResult.isValid
                        ? "✅ Válido"
                        : "⚠️ Com problemas"}
                    </span>
                  </>
                )}
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

            {/* Save with Validation */}
            <button
              onClick={handleSaveWithValidation}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                validationResult?.isValid === false
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              title={
                validationResult?.isValid === false
                  ? "Corrija os erros antes de salvar"
                  : "Salvar fluxo"
              }
            >
              <Save size={16} />
              <span>
                {validationResult?.isValid === false
                  ? "Corrigir & Salvar"
                  : "Salvar"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Flow Validation Panel */}
      <FlowValidationPanel
        nodes={nodes}
        edges={edges}
        isOpen={isValidationPanelOpen}
        onClose={() => setIsValidationPanelOpen(false)}
        onNodeSelect={handleNodeSelect}
      />

      {/* Auto Return Configuration Modal */}
      {showAutoReturnConfig && (
        <AutoReturnConfig
          strategy={autoReturnStrategy}
          onStrategyChange={updateAutoReturnStrategy}
          onClose={() => setShowAutoReturnConfig(false)}
        />
      )}
    </>
  );
};
