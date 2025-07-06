/**
 * 🔍 Hook para validação de fluxos
 * Facilita o uso do sistema de validação em componentes
 */

import { FlowValidator, ValidationResult } from "@/utils/FlowValidator";
import { useCallback, useEffect, useState } from "react";

interface UseFlowValidationOptions {
  autoValidate?: boolean;
  debounceMs?: number;
}

export const useFlowValidation = (
  nodes: any[],
  edges: any[],
  options: UseFlowValidationOptions = {}
) => {
  const { autoValidate = false, debounceMs = 1000 } = options;

  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidationTime, setLastValidationTime] = useState<Date | null>(
    null
  );

  // Função para executar validação
  const validateFlow = useCallback(async () => {
    if (nodes.length === 0) {
      setValidationResult(null);
      return null;
    }

    setIsValidating(true);

    // Simular delay para UX
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const validator = new FlowValidator(nodes, edges);
      const result = validator.validateFlow();

      setValidationResult(result);
      setLastValidationTime(new Date());

      return result;
    } catch (error) {
      console.error("Erro na validação:", error);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [nodes, edges]);

  // Validação automática com debounce
  useEffect(() => {
    if (!autoValidate) return;

    const timeoutId = setTimeout(() => {
      validateFlow();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [autoValidate, debounceMs, validateFlow]);

  // Verificações rápidas
  const hasErrors = (validationResult?.errors?.length ?? 0) > 0;
  const hasWarnings = (validationResult?.warnings?.length ?? 0) > 0;
  const isValid = validationResult?.isValid === true;
  const canSave = !hasErrors;

  // Estatísticas
  const stats = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    errorCount: validationResult?.errors?.length ?? 0,
    warningCount: validationResult?.warnings?.length ?? 0,
    infoCount: validationResult?.info?.length ?? 0,
  };

  // Validação rápida para UI (sem delay)
  const quickValidate = useCallback(() => {
    if (nodes.length === 0) return null;

    const validator = new FlowValidator(nodes, edges);
    return validator.validateFlow();
  }, [nodes, edges]);

  return {
    // Estado
    validationResult,
    isValidating,
    lastValidationTime,

    // Ações
    validateFlow,
    quickValidate,

    // Flags convenientes
    hasErrors,
    hasWarnings,
    isValid,
    canSave,

    // Estatísticas
    stats,
  };
};

/**
 * 🚦 Hook para status de validação em tempo real
 * Retorna apenas o status básico para indicadores visuais
 */
export const useFlowValidationStatus = (nodes: any[], edges: any[]) => {
  const [status, setStatus] = useState<"valid" | "invalid" | "unknown">(
    "unknown"
  );
  const [errorCount, setErrorCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    if (nodes.length === 0) {
      setStatus("unknown");
      setErrorCount(0);
      setWarningCount(0);
      return;
    }

    // Debounce para performance
    const timeoutId = setTimeout(() => {
      try {
        const validator = new FlowValidator(nodes, edges);
        const result = validator.validateFlow();

        setStatus(result.isValid ? "valid" : "invalid");
        setErrorCount(result.errors.length);
        setWarningCount(result.warnings.length);
      } catch (error) {
        console.error("Erro na validação rápida:", error);
        setStatus("unknown");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges]);

  return {
    status,
    errorCount,
    warningCount,
    isValid: status === "valid",
    hasProblems: status === "invalid",
  };
};
