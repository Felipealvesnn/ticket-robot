/**
 * 🔄 Hook para Gerenciar Retorno Automático
 * Controla o comportamento de nós sem próximo passo
 */

import { useCallback, useState } from "react";
import { AutoReturnStrategy } from "../app/flows/components/AutoReturnConfig";

export interface AutoReturnSettings {
  strategy: AutoReturnStrategy;
  updateStrategy: (strategy: AutoReturnStrategy) => void;
  resetToDefault: () => void;
  getSuggestionForNodeType: (nodeType: string) => string;
}

const DEFAULT_STRATEGY: AutoReturnStrategy = {
  type: "delay_menu",
  delaySeconds: 5,
  message: "Como posso ajudar mais?",
  enabled: true,
};

export const useAutoReturn = (): AutoReturnSettings => {
  const [strategy, setStrategy] = useState<AutoReturnStrategy>(() => {
    // Tentar carregar do localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flow-auto-return-strategy");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.warn("Erro ao carregar estratégia de retorno:", error);
        }
      }
    }
    return DEFAULT_STRATEGY;
  });

  const updateStrategy = useCallback((newStrategy: AutoReturnStrategy) => {
    setStrategy(newStrategy);

    // Salvar no localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "flow-auto-return-strategy",
        JSON.stringify(newStrategy)
      );
    }
  }, []);

  const resetToDefault = useCallback(() => {
    updateStrategy(DEFAULT_STRATEGY);
  }, [updateStrategy]);

  const getSuggestionForNodeType = useCallback(
    (nodeType: string): string => {
      if (!strategy.enabled) {
        return "Conecte manualmente ao próximo nó";
      }

      const suggestions = {
        message: `Após ${
          strategy.delaySeconds || 5
        }s, retornará ao menu principal`,
        input: "Processará a entrada e retornará ao menu principal",
        action: "Executará a ação e retornará ao menu principal",
        condition: "Avaliará a condição e seguirá o fluxo adequado",
        delay: "Aplicará o delay e continuará o fluxo",
        default: "Retornará automaticamente ao menu principal",
      };

      return (
        suggestions[nodeType as keyof typeof suggestions] || suggestions.default
      );
    },
    [strategy]
  );

  return {
    strategy,
    updateStrategy,
    resetToDefault,
    getSuggestionForNodeType,
  };
};
