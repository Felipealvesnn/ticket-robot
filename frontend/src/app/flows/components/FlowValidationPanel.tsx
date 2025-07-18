"use client";

import {
  FlowValidator,
  ValidationError,
  ValidationResult,
} from "@/utils/FlowValidator";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import { FC, useEffect, useState } from "react";

interface FlowValidationPanelProps {
  nodes: any[];
  edges: any[];
  isOpen: boolean;
  onClose: () => void;
  onNodeSelect?: (nodeId: string) => void;
}

export const FlowValidationPanel: FC<FlowValidationPanelProps> = ({
  nodes,
  edges,
  isOpen,
  onClose,
  onNodeSelect,
}) => {
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [autoValidate, setAutoValidate] = useState(true);

  // Validação automática quando o painel é aberto ou quando nodes/edges mudam
  useEffect(() => {
    if (isOpen && autoValidate) {
      runValidation();
    }
  }, [isOpen, nodes, edges, autoValidate]);

  const runValidation = () => {
    setIsValidating(true);

    // Simular processo de validação com delay para UX
    setTimeout(() => {
      try {
        const validator = new FlowValidator(nodes, edges);
        const result = validator.validateFlow();
        setValidationResult(result);
      } catch (error) {
        console.error("Erro na validação:", error);
        // Criar resultado de erro
        setValidationResult({
          isValid: false,
          errors: [
            {
              id: "validation-error",
              type: "error",
              message: "Erro interno na validação",
              description: "Houve um erro ao processar a validação do fluxo",
            },
          ],
          warnings: [],
          info: [],
          summary: {
            totalIssues: 1,
            criticalIssues: 1,
            canSave: false,
            lastValidated: new Date(),
          },
        });
      } finally {
        setIsValidating(false);
      }
    }, 300);
  };

  const handleNodeSelect = (nodeId: string) => {
    if (onNodeSelect) {
      onNodeSelect(nodeId);
    }
  };

  const getIcon = (type: ValidationError["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getBackgroundColor = (type: ValidationError["type"]) => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-green-50 border-green-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Validação do Fluxo</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Auto-validate toggle */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-validate"
                checked={autoValidate}
                onChange={(e) => setAutoValidate(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="auto-validate" className="text-sm text-gray-600">
                Validação automática
              </label>
            </div>
            <button
              onClick={runValidation}
              disabled={isValidating}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${isValidating ? "animate-spin" : ""}`}
              />
              {isValidating ? "Validando..." : "Revalidar"}
            </button>
          </div>

          {isValidating ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Analisando o fluxo...</p>
              <p className="text-sm text-gray-400">
                Verificando estrutura, configurações e boas práticas
              </p>
            </div>
          ) : !validationResult ? (
            <div className="text-center py-8">
              <button
                onClick={runValidation}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔍 Validar Fluxo
              </button>
              <p className="text-gray-500 text-sm mt-2">
                Clique para analisar o fluxo e detectar problemas
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo */}
              <div
                className={`p-4 rounded-lg border ${
                  validationResult.isValid
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <h3 className="font-semibold">
                    {validationResult.isValid
                      ? "Fluxo Válido! ✅"
                      : "Problemas Encontrados ⚠️"}
                  </h3>
                </div>
                <div className="text-sm space-y-1">
                  <p>• {validationResult.errors.length} erro(s) crítico(s)</p>
                  <p>
                    • {validationResult.warnings.length} aviso(s) de melhoria
                  </p>
                  <p>
                    • {validationResult.info.length} informação(ões) útil(eis)
                  </p>
                </div>
                {validationResult.isValid && (
                  <div className="mt-2 text-sm text-green-700 bg-green-100 rounded p-2">
                    🎉 Parabéns! Seu fluxo está pronto para ser usado.
                  </div>
                )}
              </div>

              {/* Erros Críticos */}
              {validationResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Erros Críticos ({validationResult.errors.length})
                  </h4>
                  <div className="space-y-2">
                    {validationResult.errors.map((error, index) => (
                      <ValidationItem
                        key={index}
                        error={error}
                        onNodeSelect={onNodeSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Avisos */}
              {validationResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Avisos de Melhoria ({validationResult.warnings.length})
                  </h4>
                  <div className="space-y-2">
                    {validationResult.warnings.map((warning, index) => (
                      <ValidationItem
                        key={index}
                        error={warning}
                        onNodeSelect={onNodeSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Informações */}
              {validationResult.info.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Informações do Fluxo ({validationResult.info.length})
                  </h4>
                  <div className="space-y-2">
                    {validationResult.info.map((info, index) => (
                      <ValidationItem
                        key={index}
                        error={info}
                        onNodeSelect={onNodeSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setValidationResult(null);
                if (autoValidate) runValidation();
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Nova Validação
            </button>
            {validationResult && (
              <span className="text-sm text-gray-500">
                Última validação: {new Date().toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Fechar
            </button>
            {validationResult?.isValid && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Continuar
              </button>
            )}
            {validationResult?.errors.length === 0 &&
              validationResult?.warnings.length > 0 && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Salvar Mesmo Assim
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para cada item de validação
interface ValidationItemProps {
  error: ValidationError;
  onNodeSelect?: (nodeId: string) => void;
}

const ValidationItem: FC<ValidationItemProps> = ({ error, onNodeSelect }) => {
  const getIcon = (type: ValidationError["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getBackgroundColor = (type: ValidationError["type"]) => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200 hover:bg-red-100";
      case "warning":
        return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
      case "info":
        return "bg-blue-50 border-blue-200 hover:bg-blue-100";
      default:
        return "bg-green-50 border-green-200 hover:bg-green-100";
    }
  };

  const getPriorityLabel = (type: ValidationError["type"]) => {
    switch (type) {
      case "error":
        return { label: "CRÍTICO", className: "bg-red-100 text-red-800" };
      case "warning":
        return { label: "AVISO", className: "bg-yellow-100 text-yellow-800" };
      case "info":
        return { label: "INFO", className: "bg-blue-100 text-blue-800" };
      default:
        return { label: "OK", className: "bg-green-100 text-green-800" };
    }
  };

  const priority = getPriorityLabel(error.type);

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${getBackgroundColor(
        error.type
      )}`}
    >
      <div className="flex items-start gap-3">
        {getIcon(error.type)}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h5 className="font-medium text-sm">{error.message}</h5>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${priority.className}`}
              >
                {priority.label}
              </span>
            </div>
            {error.nodeId && onNodeSelect && (
              <button
                onClick={() => onNodeSelect(error.nodeId!)}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                <Eye className="w-3 h-3" />
                Ver Nó
              </button>
            )}
          </div>
          {error.description && (
            <p className="text-sm text-gray-600 mb-2">{error.description}</p>
          )}
          {error.suggestion && (
            <div className="text-sm bg-white bg-opacity-70 rounded p-2 border-l-2 border-blue-400">
              <p className="text-blue-700 font-medium">💡 Sugestão:</p>
              <p className="text-blue-600">{error.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
