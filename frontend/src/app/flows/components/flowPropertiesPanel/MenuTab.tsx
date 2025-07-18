"use client";

import { ChevronDown, ExternalLink, Link, Plus, Trash2 } from "lucide-react";
import { FC } from "react";

interface MenuOption {
  id: string;
  key: string;
  text: string;
  value: string;
  targetNodeType?: string;
  targetNodeId?: string;
}

interface MenuTabProps {
  node: any;
  nodes: any[];
  onUpdateProperty: (property: string, value: any) => void;
  onAddNodeWithConnection: (
    type:
      | "start"
      | "message"
      | "condition"
      | "action"
      | "end"
      | "delay"
      | "image"
      | "file"
      | "webhook"
      | "database"
      | "calculation"
      | "email"
      | "phone"
      | "automation"
      | "segment"
      | "tag"
      | "transfer"
      | "ticket"
      | "input"
      | "menu",
    position: { x: number; y: number },
    sourceNodeId: string,
    edgeLabel?: string
  ) => string;
}

const nodeTypeOptions = [
  { value: "message", label: "💬 Mensagem", icon: "💬" },
  { value: "webhook", label: "🔗 Webhook", icon: "🔗" },
  { value: "transfer", label: "🎧 Transferir Atendimento", icon: "🎧" },
  { value: "input", label: "📝 Capturar Dados", icon: "📝" },
  { value: "condition", label: "🔀 Condição", icon: "🔀" },
  { value: "menu", label: "📋 Novo Menu", icon: "📋" },
  { value: "ticket", label: "🎫 Criar Ticket", icon: "🎫" },
  { value: "delay", label: "⏱️ Aguardar", icon: "⏱️" },
  { value: "image", label: "🖼️ Imagem", icon: "🖼️" },
  { value: "file", label: "📄 Arquivo", icon: "📄" },
];

export const MenuTab: FC<MenuTabProps> = ({
  node,
  nodes,
  onUpdateProperty,
  onAddNodeWithConnection,
}) => {
  const addOption = () => {
    const currentOptions = node.data?.options || [];
    const nextKey = String(currentOptions.length + 1);

    const newOption: MenuOption = {
      id: Date.now().toString(),
      key: nextKey,
      text: `Opção ${nextKey}`,
      value: `opcao_${nextKey}`,
    };

    onUpdateProperty("options", [...currentOptions, newOption]);
  };

  const updateOption = (optionId: string, updates: Partial<MenuOption>) => {
    const currentOptions = node.data?.options || [];
    const updatedOptions = currentOptions.map((option: MenuOption) =>
      option.id === optionId ? { ...option, ...updates } : option
    );
    onUpdateProperty("options", updatedOptions);
  };

  const removeOption = (optionId: string) => {
    const currentOptions = node.data?.options || [];
    const filteredOptions = currentOptions.filter(
      (option: MenuOption) => option.id !== optionId
    );
    onUpdateProperty("options", filteredOptions);
  };

  const createNodeFromOption = (optionId: string, nodeType: string) => {
    if (!node) return;

    const option = node.data?.options?.find(
      (o: MenuOption) => o.id === optionId
    );
    if (!option) return;

    // Calcular posição para o novo nó
    const newPosition = {
      x: node.position.x + 300,
      y: node.position.y + (node.data?.options?.indexOf(option) || 0) * 150,
    };

    // Configurar dados específicos do tipo de node
    let nodeData = {};
    switch (nodeType) {
      case "message":
        nodeData = {
          message: `Você escolheu: ${option.text}`,
          label: `Mensagem - ${option.text}`,
        };
        break;
      case "webhook":
        nodeData = {
          webhookUrl: "https://api.exemplo.com/webhook",
          webhookMethod: "POST",
          label: `Webhook - ${option.text}`,
        };
        break;
      case "transfer":
        nodeData = {
          label: `Atendimento - ${option.text}`,
        };
        break;
      case "input":
        nodeData = {
          variableName: `input_${option.value}`,
          validation: "text",
          label: `Capturar - ${option.text}`,
        };
        break;
      default:
        nodeData = {
          label: `${option.text}`,
        };
    }

    // Criar o novo nó conectado
    const newNodeId = onAddNodeWithConnection(
      nodeType as any,
      newPosition,
      node.id,
      option.text
    );

    // Atualizar a opção com referência ao novo node
    updateOption(optionId, {
      targetNodeType: nodeType,
      targetNodeId: newNodeId,
    });
  };

  const getConnectedNode = (optionId: string) => {
    const option = node.data?.options?.find(
      (o: MenuOption) => o.id === optionId
    );
    if (!option?.targetNodeId) return null;
    return nodes.find((n: any) => n.id === option.targetNodeId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Opções do Menu</h4>
        <button
          onClick={addOption}
          className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>

      {/* Configurações Gerais do Menu */}
      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-700">Configurações</h5>

        <div className="grid grid-cols-1 gap-3">
          {/* Checkbox para Menu Principal */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={node.data?.isMainMenu === true}
              onChange={(e) => onUpdateProperty("isMainMenu", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">🏠 Menu Principal</span>
            <span className="text-xs text-gray-500">
              (apenas um menu pode ser principal)
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={node.data?.showOptions !== false}
              onChange={(e) =>
                onUpdateProperty("showOptions", e.target.checked)
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700">
              Mostrar lista de opções
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={node.data?.allowFreeText || false}
              onChange={(e) =>
                onUpdateProperty("allowFreeText", e.target.checked)
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700">Aceitar texto livre</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={node.data?.caseSensitive || false}
              onChange={(e) =>
                onUpdateProperty("caseSensitive", e.target.checked)
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700">
              Diferenciar maiúsculas/minúsculas
            </span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Mensagem para opção inválida
          </label>
          <input
            type="text"
            value={node.data?.invalidMessage || ""}
            onChange={(e) => onUpdateProperty("invalidMessage", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="❌ Opção inválida! Escolha uma das opções disponíveis."
          />
        </div>
      </div>

      {/* Lista de Opções */}
      {node.data?.options?.length === 0 || !node.data?.options ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Nenhuma opção definida</p>
          <p className="text-xs mt-1">
            Clique em "Adicionar" para criar uma opção
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {node.data.options.map((option: MenuOption, index: number) => {
            const connectedNode = getConnectedNode(option.id);
            const hasConnection = !!connectedNode;

            return (
              <div
                key={option.id}
                className="border border-gray-200 rounded-lg p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Opção {index + 1}
                  </span>
                  <button
                    onClick={() => removeOption(option.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tecla
                    </label>
                    <input
                      type="text"
                      value={option.key}
                      onChange={(e) =>
                        updateOption(option.id, { key: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1, 2, 9..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Valor
                    </label>
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) =>
                        updateOption(option.id, { value: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="vendas, suporte..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Texto da Opção
                  </label>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      updateOption(option.id, { text: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Falar com Vendas"
                  />
                </div>

                {/* Conexão / Destino */}
                <div className="border-t pt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    <Link size={12} className="inline mr-1" />
                    Destino da Opção
                  </label>

                  {hasConnection ? (
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">
                          Conectado a:{" "}
                          <strong>
                            {connectedNode.data?.label ||
                              connectedNode.data?.type}
                          </strong>
                        </span>
                      </div>
                      <ExternalLink size={14} className="text-green-600" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={option.targetNodeType || ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              createNodeFromOption(option.id, e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                        >
                          <option value="">
                            Selecione o tipo de destino...
                          </option>
                          {nodeTypeOptions.map((nodeOption) => (
                            <option
                              key={nodeOption.value}
                              value={nodeOption.value}
                            >
                              {nodeOption.icon} {nodeOption.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Selecione que tipo de nó será criado quando esta opção
                        for escolhida
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
