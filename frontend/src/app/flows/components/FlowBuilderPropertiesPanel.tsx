"use client";

import { useFlowsStore } from "@/store";
import {
  ChevronDown,
  Clock,
  Database,
  ExternalLink,
  FileText,
  GitBranch,
  Headphones,
  Image,
  Link,
  Mail,
  MessageSquare,
  Phone,
  Play,
  Plus,
  Settings,
  StopCircle,
  Trash2,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { FC, useEffect, useState } from "react";

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
  { value: "transfer", label: "Falar com Atendente", icon: "🎧" },
  { value: "ticket", label: "Criar Ticket", icon: "🎫" },
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
    | "basic"
    | "conditions"
    | "config"
    | "integration"
    | "timing"
    | "contact"
    | "media"
    | "advanced"
  >("basic");

  // Todos os hooks devem ser chamados antes de qualquer return condicional
  const node = nodes.find((n: any) => n.id === selectedNodeId);
  const nodeType = node?.data?.type || "message";

  // Determinar quais abas mostrar baseado no tipo do nó
  const getAvailableTabs = (type: string) => {
    const baseTabs = ["basic"];

    switch (type) {
      case "condition":
        return [...baseTabs, "conditions", "advanced"];
      case "transfer":
      case "ticket":
        return [...baseTabs, "config", "advanced"];
      case "webhook":
      case "database":
        return [...baseTabs, "integration", "advanced"];
      case "delay":
        return [...baseTabs, "timing", "advanced"];
      case "email":
      case "phone":
        return [...baseTabs, "contact", "advanced"];
      case "image":
      case "file":
        return [...baseTabs, "media", "advanced"];
      default:
        return [...baseTabs, "advanced"];
    }
  };

  const availableTabs = getAvailableTabs(nodeType);

  // Ajustar aba ativa se não estiver disponível para este tipo de nó
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab("basic");
    }
  }, [nodeType, availableTabs, activeTab]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "message":
        return {
          Icon: MessageSquare,
          color: "text-blue-600",
          bg: "bg-blue-50",
        };
      case "image":
        return { Icon: Image, color: "text-green-600", bg: "bg-green-50" };
      case "file":
        return { Icon: FileText, color: "text-purple-600", bg: "bg-purple-50" };
      case "condition":
        return {
          Icon: GitBranch,
          color: "text-orange-600",
          bg: "bg-orange-50",
        };
      case "delay":
        return { Icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" };
      case "start":
        return { Icon: Play, color: "text-green-600", bg: "bg-green-50" };
      case "end":
        return { Icon: StopCircle, color: "text-red-600", bg: "bg-red-50" };
      case "transfer":
        return { Icon: Headphones, color: "text-blue-600", bg: "bg-blue-50" };
      case "ticket":
        return {
          Icon: UserCheck,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        };
      case "webhook":
        return { Icon: Link, color: "text-indigo-600", bg: "bg-indigo-50" };
      case "database":
        return { Icon: Database, color: "text-gray-600", bg: "bg-gray-50" };
      case "email":
        return { Icon: Mail, color: "text-red-600", bg: "bg-red-50" };
      case "phone":
        return { Icon: Phone, color: "text-green-600", bg: "bg-green-50" };
      default:
        return {
          Icon: MessageSquare,
          color: "text-blue-600",
          bg: "bg-blue-50",
        };
    }
  };

  const nodeIcon = getNodeIcon(nodeType);

  // Renders condicionais DEPOIS de todos os hooks
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
      </div>{" "}
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {availableTabs.map((tab) => (
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
              {tab === "config" && "Configuração"}
              {tab === "integration" && "Integração"}
              {tab === "timing" && "Tempo"}
              {tab === "contact" && "Contato"}
              {tab === "media" && "Mídia"}
              {tab === "advanced" && "Avançado"}
            </button>
          ))}
        </nav>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {" "}
        {/* Node Type Icon */}
        <div
          className={`flex items-center gap-3 p-3 ${nodeIcon.bg} rounded-lg`}
        >
          <nodeIcon.Icon size={20} className={nodeIcon.color} />
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
            )}{" "}
          </div>
        )}
        {/* Config Tab - Para Transfer e Ticket */}
        {activeTab === "config" &&
          (nodeType === "transfer" || nodeType === "ticket") && (
            <div className="space-y-4">
              {nodeType === "transfer" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem de Transferência
                    </label>
                    <textarea
                      value={node.data?.transferMessage || ""}
                      onChange={(e) =>
                        handleUpdateProperty("transferMessage", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                      placeholder="Aguarde um momento, vou transferir você para um de nossos atendentes..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento
                    </label>
                    <select
                      value={node.data?.department || "geral"}
                      onChange={(e) =>
                        handleUpdateProperty("department", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="geral">Atendimento Geral</option>
                      <option value="vendas">Vendas</option>
                      <option value="suporte">Suporte Técnico</option>
                      <option value="financeiro">Financeiro</option>
                    </select>
                  </div>
                </>
              )}
              {nodeType === "ticket" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria do Ticket
                    </label>
                    <select
                      value={node.data?.ticketCategory || "geral"}
                      onChange={(e) =>
                        handleUpdateProperty("ticketCategory", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="geral">Geral</option>
                      <option value="bug">Reportar Bug</option>
                      <option value="feature">Solicitar Funcionalidade</option>
                      <option value="suporte">Suporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridade
                    </label>
                    <select
                      value={node.data?.ticketPriority || "medium"}
                      onChange={(e) =>
                        handleUpdateProperty("ticketPriority", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        {/* Timing Tab - Para Delay */}
        {activeTab === "timing" && nodeType === "delay" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo de Espera
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={node.data?.delay || 0}
                  onChange={(e) =>
                    handleUpdateProperty("delay", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                  min="0"
                />
                <select
                  value={node.data?.delayUnit || "seconds"}
                  onChange={(e) =>
                    handleUpdateProperty("delayUnit", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="seconds">Segundos</option>
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mostrar Indicador de Digitação
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={node.data?.showTyping || false}
                  onChange={(e) =>
                    handleUpdateProperty("showTyping", e.target.checked)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">
                  Simular que o bot está digitando
                </span>
              </label>
            </div>
          </div>
        )}
        {/* Contact Tab - Para Email e Phone */}
        {activeTab === "contact" &&
          (nodeType === "email" || nodeType === "phone") && (
            <div className="space-y-4">
              {nodeType === "email" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assunto do Email
                    </label>
                    <input
                      type="text"
                      value={node.data?.emailSubject || ""}
                      onChange={(e) =>
                        handleUpdateProperty("emailSubject", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Assunto do email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template do Email
                    </label>
                    <textarea
                      value={node.data?.emailTemplate || ""}
                      onChange={(e) =>
                        handleUpdateProperty("emailTemplate", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                      placeholder="Conteúdo do email..."
                    />
                  </div>
                </>
              )}
              {nodeType === "phone" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Telefone
                    </label>
                    <input
                      type="tel"
                      value={node.data?.phoneNumber || ""}
                      onChange={(e) =>
                        handleUpdateProperty("phoneNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem de Áudio (opcional)
                    </label>
                    <textarea
                      value={node.data?.audioMessage || ""}
                      onChange={(e) =>
                        handleUpdateProperty("audioMessage", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                      placeholder="Mensagem que será convertida em áudio..."
                    />
                  </div>
                </>
              )}
            </div>
          )}
        {/* Media Tab - Para Image e File */}
        {activeTab === "media" &&
          (nodeType === "image" || nodeType === "file") && (
            <div className="space-y-4">
              {/* Upload de Arquivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {nodeType === "image" ? "Imagem" : "Arquivo"}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id={`media-upload-${node.id}`}
                    accept={
                      nodeType === "image"
                        ? "image/*"
                        : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // TODO: Implementar upload para API
                        console.log("Upload file:", file);
                        // Por enquanto, apenas atualizar com o nome do arquivo
                        handleUpdateProperty("fileName", file.name);
                        handleUpdateProperty("fileSize", file.size);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor={`media-upload-${node.id}`}
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Clique para selecionar{" "}
                      {nodeType === "image" ? "uma imagem" : "um arquivo"}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      {nodeType === "image"
                        ? "PNG, JPG, GIF até 10MB"
                        : "PDF, DOC, XLS, PPT até 10MB"}
                    </span>
                  </label>
                </div>

                {/* Mostrar arquivo selecionado */}
                {node.data?.fileName && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        📎 {node.data.fileName}
                      </span>
                      <button
                        onClick={() => {
                          handleUpdateProperty("fileName", "");
                          handleUpdateProperty("fileSize", 0);
                          handleUpdateProperty("mediaId", "");
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {node.data?.fileSize && (
                      <span className="text-xs text-gray-500">
                        {(node.data.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Legenda/Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {nodeType === "image"
                    ? "Legenda (opcional)"
                    : "Descrição (opcional)"}
                </label>
                <textarea
                  value={node.data?.caption || node.data?.description || ""}
                  onChange={(e) =>
                    handleUpdateProperty(
                      nodeType === "image" ? "caption" : "description",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  placeholder={
                    nodeType === "image"
                      ? "Texto que acompanha a imagem..."
                      : "Descrição do arquivo..."
                  }
                />
              </div>

              {/* Aguardar resposta do usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comportamento
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={node.data?.awaitInput !== false}
                    onChange={(e) =>
                      handleUpdateProperty("awaitInput", e.target.checked)
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    Aguardar resposta do usuário antes de continuar
                  </span>
                </label>
              </div>
            </div>
          )}
        {/* Integration Tab - Para Webhook e Database */}
        {activeTab === "integration" &&
          (nodeType === "webhook" || nodeType === "database") && (
            <div className="space-y-4">
              {nodeType === "webhook" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL do Webhook
                    </label>
                    <input
                      type="url"
                      value={node.data?.webhookUrl || ""}
                      onChange={(e) =>
                        handleUpdateProperty("webhookUrl", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://api.exemplo.com/webhook"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método HTTP
                    </label>
                    <select
                      value={node.data?.webhookMethod || "POST"}
                      onChange={(e) =>
                        handleUpdateProperty("webhookMethod", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                </>
              )}
              {nodeType === "database" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operação
                    </label>
                    <select
                      value={node.data?.dbOperation || "SELECT"}
                      onChange={(e) =>
                        handleUpdateProperty("dbOperation", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SELECT">Consultar (SELECT)</option>
                      <option value="INSERT">Inserir (INSERT)</option>
                      <option value="UPDATE">Atualizar (UPDATE)</option>
                      <option value="DELETE">Deletar (DELETE)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tabela
                    </label>
                    <input
                      type="text"
                      value={node.data?.dbTable || ""}
                      onChange={(e) =>
                        handleUpdateProperty("dbTable", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="nome_da_tabela"
                    />
                  </div>
                </>
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
