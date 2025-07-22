"use client";

import { FC } from "react";

interface BasicTabProps {
  node: any;
  nodeType: string;
  onUpdateProperty: (property: string, value: any) => void;
}

export const BasicTab: FC<BasicTabProps> = ({
  node,
  nodeType,
  onUpdateProperty,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Nó
        </label>
        <input
          type="text"
          value={node.data?.label || ""}
          onChange={(e) => onUpdateProperty("label", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Digite o nome do nó"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          value={node.data?.description || ""}
          onChange={(e) => onUpdateProperty("description", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
          placeholder="Descrição do nó"
        />
      </div>

      {nodeType === "message" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem
          </label>
          <textarea
            value={node.data?.message || ""}
            onChange={(e) => onUpdateProperty("message", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            placeholder="Digite a mensagem que será enviada..."
          />
        </div>
      )}

      {nodeType === "input" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem de Prompt <span className="text-red-500">*</span>
          </label>
          <textarea
            value={node.data?.message || ""}
            onChange={(e) => onUpdateProperty("message", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            placeholder="Digite a pergunta que será feita ao usuário (ex: Por favor, digite seu nome completo:)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta mensagem será exibida ao usuário solicitando o input
          </p>
        </div>
      )}

      {nodeType === "input" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texto de Ajuda (Placeholder)
          </label>
          <input
            type="text"
            value={node.data?.placeholder || ""}
            onChange={(e) => onUpdateProperty("placeholder", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Digite aqui..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Texto de ajuda que aparece no campo de input (opcional)
          </p>
        </div>
      )}

      {/* Campo específico para nó START - configurar triggers */}
      {nodeType === "start" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔑 Palavras-chave que ativam este fluxo
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={node.data?.triggerInput || ""}
              onChange={(e) => onUpdateProperty("triggerInput", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: oi, olá, falar com vendas, suporte"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const currentInput = e.currentTarget.value.trim();
                  if (currentInput) {
                    const currentTriggers = node.data?.triggers || [];
                    const newTriggers = [...currentTriggers, currentInput];
                    onUpdateProperty("triggers", newTriggers);
                    onUpdateProperty("triggerInput", "");
                  }
                }
              }}
            />
            <p className="text-xs text-gray-500">
              Digite uma palavra-chave e pressione Enter para adicionar. Essas
              palavras ativarão automaticamente este fluxo quando enviadas pelo
              usuário.
            </p>

            {/* Lista de triggers adicionados */}
            {node.data?.triggers &&
              Array.isArray(node.data.triggers) &&
              node.data.triggers.length > 0 && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Triggers configurados:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {node.data.triggers.map(
                      (trigger: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {trigger}
                          <button
                            onClick={() => {
                              const newTriggers = node.data.triggers.filter(
                                (_: string, i: number) => i !== index
                              );
                              onUpdateProperty("triggers", newTriggers);
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {nodeType === "delay" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tempo de Espera (segundos)
          </label>
          <input
            type="number"
            value={node.data?.delay || 0}
            onChange={(e) =>
              onUpdateProperty("delay", parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
          />
        </div>
      )}
    </div>
  );
};
