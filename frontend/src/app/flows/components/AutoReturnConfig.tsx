/**
 * 🔄 Configuração de Retorno Automático
 * Permite configurar o comportamento quando um nó não tem próximo passo
 */

import { Clock, Play, RotateCcw, Settings, X } from "lucide-react";
import React from "react";

export interface AutoReturnStrategy {
  type: "auto_menu" | "delay_menu" | "manual_finish" | "auto_start";
  delaySeconds?: number;
  message?: string;
  enabled: boolean;
}

interface AutoReturnConfigProps {
  strategy: AutoReturnStrategy;
  onStrategyChange: (strategy: AutoReturnStrategy) => void;
  onClose: () => void;
}

export const AutoReturnConfig: React.FC<AutoReturnConfigProps> = ({
  strategy,
  onStrategyChange,
  onClose,
}) => {
  const strategies = [
    {
      type: "auto_menu" as const,
      title: "🔄 Retorno Automático ao Menu",
      description: "Volta automaticamente para o menu principal",
      icon: <RotateCcw className="w-5 h-5" />,
      recommended: true,
      delayOptions: [3, 5, 8, 10],
    },
    {
      type: "delay_menu" as const,
      title: "⏱️ Retorno com Delay",
      description: "Pausa e depois volta ao menu",
      icon: <Clock className="w-5 h-5" />,
      recommended: true,
      delayOptions: [3, 5, 8, 10],
    },
    {
      type: "manual_finish" as const,
      title: "⚠️ Finalização Manual",
      description: "Usuário deve conectar manualmente (não recomendado)",
      icon: <X className="w-5 h-5" />,
      recommended: false,
    },
    {
      type: "auto_start" as const,
      title: "🔄 Restart do Fluxo",
      description: "Reinicia o fluxo do início",
      icon: <Play className="w-5 h-5" />,
      recommended: false,
    },
  ];

  const handleStrategySelect = (type: AutoReturnStrategy["type"]) => {
    onStrategyChange({
      ...strategy,
      type,
      delaySeconds: type.includes("delay") ? 5 : strategy.delaySeconds,
    });
  };

  const defaultMessages = {
    auto_menu: "Como posso ajudar mais?",
    delay_menu: "Aguarde um momento...",
    manual_finish: "",
    auto_start: "Vamos começar novamente!",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div
          className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Configurar Retorno Automático
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configure o que acontece quando um nó não tem próximo passo
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Estratégias */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Escolha a Estratégia
                </h3>
                {strategies.map((strategyOption) => (
                  <div
                    key={strategyOption.type}
                    className={`
                      relative border rounded-lg p-4 cursor-pointer transition-all
                      ${
                        strategy.type === strategyOption.type
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }
                      ${
                        strategyOption.recommended
                          ? "ring-2 ring-green-200"
                          : ""
                      }
                    `}
                    onClick={() => handleStrategySelect(strategyOption.type)}
                  >
                    {strategyOption.recommended && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        ⭐ Recomendado
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {strategyOption.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={strategy.type === strategyOption.type}
                            onChange={() =>
                              handleStrategySelect(strategyOption.type)
                            }
                            className="text-blue-600"
                          />
                          <h4 className="font-medium text-gray-900">
                            {strategyOption.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {strategyOption.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Configurações da Estratégia Selecionada */}
              {strategy.type.includes("delay") && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Configurações de Delay
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo de espera (segundos)
                      </label>
                      <div className="flex space-x-2">
                        {[3, 5, 8, 10].map((seconds) => (
                          <button
                            key={seconds}
                            onClick={() =>
                              onStrategyChange({
                                ...strategy,
                                delaySeconds: seconds,
                              })
                            }
                            className={`
                              px-4 py-2 rounded border
                              ${
                                strategy.delaySeconds === seconds
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                              }
                            `}
                          >
                            {seconds}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagem Personalizada */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Mensagem de Transição
                </h3>
                <div className="space-y-3">
                  <textarea
                    value={strategy.message || defaultMessages[strategy.type]}
                    onChange={(e) =>
                      onStrategyChange({ ...strategy, message: e.target.value })
                    }
                    placeholder={defaultMessages[strategy.type]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Esta mensagem será exibida antes do retorno ao menu
                  </p>
                </div>
              </div>

              {/* Ativar/Desativar */}
              <div className="border-t pt-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={strategy.enabled}
                    onChange={(e) =>
                      onStrategyChange({
                        ...strategy,
                        enabled: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Ativar retorno automático
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Quando desativado, será necessário conectar manualmente os nós
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            >
              Aplicar Configurações
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
