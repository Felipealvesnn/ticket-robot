"use client";

import { useFlowsStore } from "@/store";
import {
  ChevronDown,
  ExternalLink,
  Link,
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { FC, useState } from "react";

interface Condition {
  id: string;
  field: string;
  operator: "equals" | "contains" | "greater" | "less" | "exists" | "regex";
  value: string;
  label: string;
  targetNodeType?: string;
  targetNodeId?: string;
}

const operatorLabels = {
  equals: "É igual a",
  contains: "Contém",
  greater: "Maior que",
  less: "Menor que",
  exists: "Existe",
  regex: "Expressão regular",
};

const fieldOptions = [
  { value: "message", label: "Mensagem do usuário" },
  { value: "user_name", label: "Nome do usuário" },
  { value: "user_phone", label: "Telefone do usuário" },
  { value: "last_message_time", label: "Última mensagem" },
  { value: "conversation_count", label: "Número de conversas" },
  { value: "custom_field", label: "Campo personalizado" },
];

const nodeTypeOptions = [
  { value: "message", label: "Mensagem de Texto", icon: "💬" },
  { value: "image", label: "Imagem", icon: "🖼️" },
  { value: "file", label: "Arquivo", icon: "📎" },
  { value: "delay", label: "Aguardar", icon: "⏰" },
  { value: "condition", label: "Condição", icon: "🔀" },
  { value: "webhook", label: "Webhook", icon: "🔗" },
  { value: "email", label: "Enviar Email", icon: "📧" },
  { value: "end", label: "Fim do Flow", icon: "🏁" },
];

export const FlowBuilderPropertiesPanel: FC = () => {
  const {
    selectedNodeId,
    nodes,
    edges,
    updateNodeData,
    deleteNode,
    addNodeWithConnection,
  } = useFlowsStore();
  const [activeTab, setActiveTab] = useState<
    "basic" | "conditions" | "advanced"
  >("basic");

  if (!selectedNodeId) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 mt-8">
          <Settings size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Selecione um nó para editar suas propriedades</p>
        </div>
      </div>
    );
  }

  const node = nodes.find((n: any) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 mt-8">
          <p>Nó não encontrado</p>
        </div>
      </div>
    );
  }

  const handleUpdateProperty = (property: string, value: any) => {
    if (!selectedNodeId) return;
    updateNodeData(selectedNodeId, {
      [property]: value,
    });
  };

  const addCondition = () => {
    const currentConditions = node.data?.conditions || [];
    const newCondition: Condition = {
      id: Date.now().toString(),
      field: "message",
      operator: "equals",
      value: "",
      label: `Condição ${currentConditions.length + 1}`,
    };

    handleUpdateProperty("conditions", [...currentConditions, newCondition]);
  };

  const updateCondition = (
    conditionId: string,
    updates: Partial<Condition>
  ) => {
    const currentConditions = node.data?.conditions || [];
    const updatedConditions = currentConditions.map((condition: Condition) =>
      condition.id === conditionId ? { ...condition, ...updates } : condition
    );
    handleUpdateProperty("conditions", updatedConditions);
  };
  const removeCondition = (conditionId: string) => {
    const currentConditions = node.data?.conditions || [];
    const filteredConditions = currentConditions.filter(
      (condition: Condition) => condition.id !== conditionId
    );
    handleUpdateProperty("conditions", filteredConditions);
  };

  const createNodeFromCondition = (conditionId: string, nodeType: string) => {
    if (!selectedNodeId || !node) return;

    const condition = node.data?.conditions?.find(
      (c: Condition) => c.id === conditionId
    );
    if (!condition) return;

    // Calcular posição para o novo nó (à direita e um pouco abaixo)
    const newPosition = {
      x: node.position.x + 300,
      y: node.position.y + 100,
    };

    // Criar o novo nó conectado com o label da condição
    const newNodeId = addNodeWithConnection(
      nodeType as any,
      newPosition,
      selectedNodeId,
      condition.label || condition.value
    );

    // Atualizar a condição para referenciar o novo nó
    updateCondition(conditionId, {
      targetNodeType: nodeType,
      targetNodeId: newNodeId,
    });
  };

  const getConnectedNode = (conditionId: string) => {
    const condition = node.data?.conditions?.find(
      (c: Condition) => c.id === conditionId
    );
    if (!condition?.targetNodeId) return null;

    return nodes.find((n: any) => n.id === condition.targetNodeId);
  };

  const getConditionEdge = (conditionId: string) => {
    const condition = node.data?.conditions?.find(
      (c: Condition) => c.id === conditionId
    );
    if (!condition?.targetNodeId) return null;

    return edges.find(
      (edge: any) =>
        edge.source === selectedNodeId &&
        edge.target === condition.targetNodeId &&
        (edge.label === condition.label || edge.label === condition.value)
    );
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;

    if (
      confirm(
        "Tem certeza que deseja excluir este nó? Esta ação não pode ser desfeita."
      )
    ) {
      deleteNode(selectedNodeId);
    }
  };

  const nodeType = node.data?.type || "message";

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {" "}
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Propriedades</h3>
        <div className="flex items-center gap-2">
          {/* Botão de deletar nó */}
          {nodeType !== "start" && (
            <button
              onClick={handleDeleteNode}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Excluir nó"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => useFlowsStore.getState().setSelectedNode(null)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {["basic", "conditions", "advanced"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }
              `}
            >
              {tab === "basic" && "Básico"}
              {tab === "conditions" && "Condições"}
              {tab === "advanced" && "Avançado"}
            </button>
          ))}
        </nav>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Type Icon */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <MessageSquare size={20} className="text-blue-600" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
            </div>
            <div className="text-xs text-gray-500">ID: {node.id}</div>
          </div>
        </div>

        {/* Basic Tab */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Nó
              </label>
              <input
                type="text"
                value={node.data?.label || ""}
                onChange={(e) => handleUpdateProperty("label", e.target.value)}
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
                onChange={(e) =>
                  handleUpdateProperty("description", e.target.value)
                }
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
                  onChange={(e) =>
                    handleUpdateProperty("message", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  placeholder="Digite a mensagem que será enviada..."
                />
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
                    handleUpdateProperty("delay", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>
            )}
          </div>
        )}

        {/* Conditions Tab */}
        {activeTab === "conditions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Condições</h4>
              <button
                onClick={addCondition}
                className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>

            {node.data?.conditions?.length === 0 || !node.data?.conditions ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhuma condição definida</p>
                <p className="text-xs mt-1">
                  Clique em "Adicionar" para criar uma condição
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {node.data.conditions.map(
                  (condition: Condition, index: number) => {
                    const connectedNode = getConnectedNode(condition.id);
                    const hasConnection = !!connectedNode;

                    return (
                      <div
                        key={condition.id}
                        className="border border-gray-200 rounded-lg p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Condição {index + 1}
                          </span>
                          <button
                            onClick={() => removeCondition(condition.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Campo
                          </label>
                          <div className="relative">
                            <select
                              value={condition.field}
                              onChange={(e) =>
                                updateCondition(condition.id, {
                                  field: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                            >
                              {fieldOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={16}
                              className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Operador
                          </label>
                          <div className="relative">
                            <select
                              value={condition.operator}
                              onChange={(e) =>
                                updateCondition(condition.id, {
                                  operator: e.target.value as any,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                            >
                              {Object.entries(operatorLabels).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                )
                              )}
                            </select>
                            <ChevronDown
                              size={16}
                              className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Valor
                          </label>
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                value: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Digite o valor para comparação"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Rótulo (opcional)
                          </label>
                          <input
                            type="text"
                            value={condition.label}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                label: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nome da condição"
                          />
                        </div>

                        {/* Conexão / Destino */}
                        <div className="border-t pt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            <Link size={12} className="inline mr-1" />
                            Destino da Condição
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
                              <ExternalLink
                                size={14}
                                className="text-green-600"
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="relative">
                                <select
                                  value={condition.targetNodeType || ""}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      createNodeFromCondition(
                                        condition.id,
                                        e.target.value
                                      );
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                >
                                  <option value="">
                                    Selecione o tipo de resposta...
                                  </option>
                                  {nodeTypeOptions.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.icon} {option.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={16}
                                  className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                                />
                              </div>
                              <p className="text-xs text-gray-500">
                                Selecione que tipo de nó será criado quando esta
                                condição for atendida
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === "advanced" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posição
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">X</label>
                  <input
                    type="number"
                    value={Math.round(node.position.x)}
                    readOnly
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Y</label>
                  <input
                    type="number"
                    value={Math.round(node.position.y)}
                    readOnly
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validação
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={node.data?.isValid || false}
                    onChange={(e) =>
                      handleUpdateProperty("isValid", e.target.checked)
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Nó está válido</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={node.data?.hasError || false}
                    onChange={(e) =>
                      handleUpdateProperty("hasError", e.target.checked)
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Mostrar erro</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
