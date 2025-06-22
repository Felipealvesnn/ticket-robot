"use client";

import {
  Badge,
  Button,
  Card,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Textarea,
  Tooltip,
} from "flowbite-react";
import { useCallback, useState } from "react";
import {
  HiChatBubbleLeftRight,
  HiCog6Tooth,
  HiDocumentDuplicate,
  HiEye,
  HiListBullet,
  HiPlay,
  HiPlus,
  HiSquares2X2,
  HiTrash,
} from "react-icons/hi2";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  NodeTypes,
} from "reactflow";

import { useFlowsStore } from "@/store/flows";

import "reactflow/dist/style.css";

// Componente de nó customizado
const CustomChatNode = ({
  data,
  selected,
}: {
  data: any;
  selected: boolean;
}) => {
  const getNodeStyle = () => {
    const baseStyle =
      "rounded-xl border-2 shadow-lg transition-all duration-200 min-w-[200px] max-w-[280px] bg-white";

    switch (data.type) {
      case "start":
        return `${baseStyle} border-green-400 ${
          selected ? "ring-4 ring-green-300" : ""
        } bg-gradient-to-br from-green-50 to-green-100`;
      case "message":
        return `${baseStyle} border-blue-400 ${
          selected ? "ring-4 ring-blue-300" : ""
        } bg-gradient-to-br from-blue-50 to-blue-100`;
      case "condition":
        return `${baseStyle} border-yellow-400 ${
          selected ? "ring-4 ring-yellow-300" : ""
        } bg-gradient-to-br from-yellow-50 to-yellow-100`;
      case "action":
        return `${baseStyle} border-purple-400 ${
          selected ? "ring-4 ring-purple-300" : ""
        } bg-gradient-to-br from-purple-50 to-purple-100`;
      case "end":
        return `${baseStyle} border-red-400 ${
          selected ? "ring-4 ring-red-300" : ""
        } bg-gradient-to-br from-red-50 to-red-100`;
      default:
        return `${baseStyle} border-gray-300`;
    }
  };

  const getIcon = () => {
    switch (data.type) {
      case "start":
        return "🚀";
      case "message":
        return "💬";
      case "condition":
        return "❓";
      case "action":
        return "⚡";
      case "end":
        return "🏁";
      default:
        return "📦";
    }
  };

  const getTitle = () => {
    return data.label || data.title || "Novo Nó";
  };

  const getContent = () => {
    if (data.message) return data.message;
    if (data.condition) return `Condição: ${data.condition}`;
    if (data.action) return `Ação: ${data.action}`;
    return "";
  };

  return (
    <div className={getNodeStyle()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getIcon()}</span>
          <span className="font-semibold text-gray-800 text-sm">
            {getTitle()}
          </span>
        </div>
        {data.conditions && data.conditions.length > 0 && (
          <Badge color="purple" size="xs">
            {data.conditions.length} opções
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {getContent() && (
          <p className="text-sm text-gray-700 line-clamp-3">{getContent()}</p>
        )}

        {/* Preview das condições para nós de menu */}
        {data.conditions && data.conditions.length > 0 && (
          <div className="space-y-1 mt-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Opções:</p>
            {data.conditions.slice(0, 3).map((condition: any, idx: number) => (
              <div
                key={idx}
                className="text-xs bg-gray-50 rounded px-2 py-1 border"
              >
                {condition.label || condition.value}
              </div>
            ))}
            {data.conditions.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{data.conditions.length - 3} mais...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Handles para conexões */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomChatNode,
};

// Templates de flows prontos
const FLOW_TEMPLATES = [
  {
    id: "welcome",
    name: "Boas-vindas Simples",
    description: "Flow básico de boas-vindas com menu principal",
    template: {
      id: "template-welcome",
      name: "Boas-vindas Simples",
      description: "Flow básico de boas-vindas",
      nodes: [
        {
          id: "start-1",
          type: "custom",
          position: { x: 100, y: 100 },
          data: {
            type: "start",
            label: "Início",
          },
        },
        {
          id: "message-1",
          type: "custom",
          position: { x: 300, y: 200 },
          data: {
            type: "message",
            label: "Boas-vindas",
            message:
              "Olá! 👋 Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?",
          },
        },
        {
          id: "condition-1",
          type: "custom",
          position: { x: 300, y: 350 },
          data: {
            type: "condition",
            label: "Menu Principal",
            conditions: [
              { value: "atendente", label: "📞 Falar com atendente" },
              { value: "precos", label: "💰 Consultar preços" },
              { value: "produtos", label: "📋 Ver produtos" },
            ],
          },
        },
      ],
      edges: [
        {
          id: "e1-2",
          source: "start-1",
          target: "message-1",
          type: "smoothstep",
        },
        {
          id: "e2-3",
          source: "message-1",
          target: "condition-1",
          type: "smoothstep",
        },
      ],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggers: ["oi", "olá", "hello"],
    },
  },
  {
    id: "support",
    name: "Suporte Técnico",
    description: "Flow para atendimento técnico com triagem",
    template: {
      id: "template-support",
      name: "Suporte Técnico",
      description: "Flow para atendimento técnico",
      nodes: [
        {
          id: "start-2",
          type: "custom",
          position: { x: 100, y: 100 },
          data: {
            type: "start",
            label: "Início",
          },
        },
        {
          id: "message-2",
          type: "custom",
          position: { x: 300, y: 200 },
          data: {
            type: "message",
            label: "Suporte Técnico",
            message:
              "Olá! Você está no suporte técnico. Vamos resolver seu problema juntos! 🔧",
          },
        },
        {
          id: "condition-2",
          type: "custom",
          position: { x: 300, y: 350 },
          data: {
            type: "condition",
            label: "Tipo do Problema",
            conditions: [
              { value: "conexao", label: "🌐 Problema de conexão" },
              { value: "sistema", label: "💻 Erro no sistema" },
              { value: "login", label: "🔑 Problema de login" },
              { value: "outro", label: "❓ Outro problema" },
            ],
          },
        },
      ],
      edges: [
        {
          id: "e1-2",
          source: "start-2",
          target: "message-2",
          type: "smoothstep",
        },
        {
          id: "e2-3",
          source: "message-2",
          target: "condition-2",
          type: "smoothstep",
        },
      ],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggers: ["problema", "erro", "suporte"],
    },
  },
];

export default function FlowBuilderPage() {
  // Store do Zustand
  const {
    flows,
    currentFlow,
    nodes,
    edges,
    selectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    updateNodeData,
    setSelectedNode,
    setCurrentFlow,
    createFlow,
    createFlowFromTemplate,
    deleteFlow,
    duplicateFlow,
  } = useFlowsStore();

  // Estados da UI
  const [leftPanel, setLeftPanel] = useState<
    "flows" | "templates" | "elements"
  >("flows");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");

  // Estados do editor de nó
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeMessage, setNodeMessage] = useState("");
  const [nodeCondition, setNodeCondition] = useState("");
  const [nodeAction, setNodeAction] = useState("");

  // Callbacks do ReactFlow
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      if (node.data) {
        setNodeLabel(node.data.label || "");
        setNodeMessage(node.data.message || "");
        setNodeCondition(node.data.condition || "");
        setNodeAction(node.data.action || "");
      }
    },
    [setSelectedNode]
  );

  // Funções para criar novos nós
  const createNewNode = (type: string) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };
    addNode(type as any, position);
  };

  // Função para aplicar template
  const applyTemplate = (template: any) => {
    createFlowFromTemplate(template.template);
  };

  // Função para criar flow do zero
  const createNewFlow = () => {
    if (!newFlowName.trim()) return;

    createFlow(newFlowName, newFlowDescription);
    setNewFlowName("");
    setNewFlowDescription("");
    setShowCreateModal(false);
  };

  // Função para salvar mudanças no nó
  const saveNodeChanges = () => {
    if (!selectedNodeId) return;

    const nodeData: any = {
      label: nodeLabel,
    };

    if (nodeMessage.trim()) nodeData.message = nodeMessage;
    if (nodeCondition.trim()) nodeData.condition = nodeCondition;
    if (nodeAction.trim()) nodeData.action = nodeAction;

    updateNodeData(selectedNodeId, nodeData);
    setShowNodeModal(false);
  };

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Painel Esquerdo */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Tabs do painel esquerdo */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setLeftPanel("flows")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanel === "flows"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <HiListBullet className="w-4 h-4 inline mr-2" />
            Flows
          </button>
          <button
            onClick={() => setLeftPanel("templates")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanel === "templates"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <HiSquares2X2 className="w-4 h-4 inline mr-2" />
            Templates
          </button>
          <button
            onClick={() => setLeftPanel("elements")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              leftPanel === "elements"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <HiPlus className="w-4 h-4 inline mr-2" />
            Elementos
          </button>
        </div>

        {/* Conteúdo do painel esquerdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {leftPanel === "flows" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Meus Flows</h3>
                <Button size="xs" onClick={() => setShowCreateModal(true)}>
                  <HiPlus className="w-4 h-4" />
                </Button>
              </div>

              {flows.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <HiChatBubbleLeftRight className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    Nenhum flow criado ainda
                  </p>
                  <Button onClick={() => setShowCreateModal(true)} size="sm">
                    Criar Primeiro Flow
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {flows.map((flow) => (
                    <Card
                      key={flow.id}
                      className={`cursor-pointer transition-all ${
                        currentFlow?.id === flow.id
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setCurrentFlow(flow)}
                    >
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900">
                          {flow.name}
                        </h4>
                        {flow.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {flow.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex space-x-4 text-xs text-gray-500">
                            <span>{flow.nodes.length} nós</span>
                            <span>{flow.edges.length} conexões</span>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              size="xs"
                              color="gray"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateFlow(flow.id);
                              }}
                            >
                              <HiDocumentDuplicate className="w-3 h-3" />
                            </Button>
                            <Button
                              size="xs"
                              color="failure"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    "Tem certeza que deseja excluir este flow?"
                                  )
                                ) {
                                  deleteFlow(flow.id);
                                }
                              }}
                            >
                              <HiTrash className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {leftPanel === "templates" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Templates Prontos</h3>
              <div className="space-y-3">
                {FLOW_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {template.name}
                      </h4>
                      <p className="text-xs text-gray-600 mb-3">
                        {template.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {template.template.nodes.length} elementos
                        </div>
                        <Button
                          size="xs"
                          onClick={() => applyTemplate(template)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Usar Template
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500">💡</div>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">Dica</h4>
                    <p className="text-xs text-blue-700">
                      Os templates são uma ótima forma de começar rapidamente.
                      Você pode modificá-los depois de aplicar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {leftPanel === "elements" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Elementos do Flow</h3>
              <p className="text-xs text-gray-600 mb-4">
                Clique para adicionar ao canvas
              </p>
              <div className="space-y-2">
                {[
                  {
                    type: "start",
                    icon: "🚀",
                    name: "Início",
                    desc: "Ponto de entrada do flow",
                  },
                  {
                    type: "message",
                    icon: "💬",
                    name: "Mensagem",
                    desc: "Enviar texto ou mídia",
                  },
                  {
                    type: "condition",
                    icon: "❓",
                    name: "Menu/Condição",
                    desc: "Criar opções para o usuário",
                  },
                  {
                    type: "action",
                    icon: "⚡",
                    name: "Ação",
                    desc: "Executar função ou integração",
                  },
                  {
                    type: "end",
                    icon: "🏁",
                    name: "Fim",
                    desc: "Finalizar conversa",
                  },
                ].map((element) => (
                  <Tooltip key={element.type} content={element.desc}>
                    <Card
                      className="cursor-pointer hover:shadow-md hover:scale-105 transition-all"
                      onClick={() => createNewNode(element.type)}
                    >
                      <div className="p-3 flex items-center space-x-3">
                        <span className="text-xl">{element.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{element.name}</p>
                          <p className="text-xs text-gray-500">
                            {element.desc}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Tooltip>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <div className="text-green-500">🎯</div>
                  <div>
                    <h4 className="font-medium text-green-800 mb-1">
                      Como usar
                    </h4>
                    <div className="text-xs text-green-700 space-y-1">
                      <p>1. Adicione elementos clicando neles</p>
                      <p>2. Conecte os nós arrastando as bolinhas</p>
                      <p>3. Clique em um nó para editá-lo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header do Canvas */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              {currentFlow ? (
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {currentFlow.name}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {currentFlow.description}
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Flow Builder
                  </h1>
                  <p className="text-sm text-gray-600">
                    Crie flows interativos para seu chatbot
                  </p>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Button color="gray" size="sm">
                <HiEye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" size="sm">
                <HiPlay className="w-4 h-4 mr-2" />
                Publicar
              </Button>
            </div>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1">
          {currentFlow ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-50"
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-gray-300 mb-6">
                  <HiChatBubbleLeftRight className="w-24 h-24 mx-auto" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Comece criando seu primeiro flow
                </h2>
                <p className="text-gray-600 mb-8">
                  Use nossos templates prontos ou crie um flow do zero para seu
                  chatbot
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => setLeftPanel("templates")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Ver Templates
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => setShowCreateModal(true)}
                    className="w-full"
                  >
                    Criar do Zero
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Painel Direito - Propriedades */}
      {currentFlow && selectedNode && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Propriedades do Nó</h3>
            <p className="text-sm text-gray-600 capitalize">
              {selectedNode.data.type}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <Button onClick={() => setShowNodeModal(true)} className="w-full">
              <HiCog6Tooth className="w-4 h-4 mr-2" />
              Editar Nó
            </Button>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Informações</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Título:</span>{" "}
                  {selectedNode.data.label}
                </div>
                {selectedNode.data.message && (
                  <div>
                    <span className="font-medium">Mensagem:</span>
                    <p className="text-gray-600 mt-1 text-xs bg-gray-50 p-2 rounded">
                      {selectedNode.data.message}
                    </p>
                  </div>
                )}
                {selectedNode.data.condition && (
                  <div>
                    <span className="font-medium">Condição:</span>
                    <p className="text-gray-600 mt-1 text-xs bg-gray-50 p-2 rounded">
                      {selectedNode.data.condition}
                    </p>
                  </div>
                )}
                {selectedNode.data.action && (
                  <div>
                    <span className="font-medium">Ação:</span>
                    <p className="text-gray-600 mt-1 text-xs bg-gray-50 p-2 rounded">
                      {selectedNode.data.action}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <Button
                color="failure"
                size="sm"
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir este nó?")) {
                    deleteNode(selectedNodeId!);
                  }
                }}
                className="w-full"
              >
                <HiTrash className="w-4 h-4 mr-2" />
                Excluir Nó
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar Flow */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <ModalHeader>🎨 Criar Novo Flow</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Flow
              </label>
              <TextInput
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="Ex: Atendimento ao Cliente"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <Textarea
                value={newFlowDescription}
                onChange={(e) => setNewFlowDescription(e.target.value)}
                placeholder="Descreva o propósito deste flow..."
                rows={3}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={createNewFlow}
            disabled={!newFlowName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Criar Flow
          </Button>
          <Button color="gray" onClick={() => setShowCreateModal(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de Editar Nó */}
      <Modal
        show={showNodeModal}
        onClose={() => setShowNodeModal(false)}
        size="lg"
      >
        <ModalHeader>⚙️ Editar {selectedNode?.data?.type}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título/Label
              </label>
              <TextInput
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                placeholder="Título do nó"
                autoFocus
              />
            </div>

            {selectedNode?.data?.type === "message" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem
                </label>
                <Textarea
                  value={nodeMessage}
                  onChange={(e) => setNodeMessage(e.target.value)}
                  placeholder="Digite a mensagem que será enviada..."
                  rows={4}
                />
              </div>
            )}

            {selectedNode?.data?.type === "condition" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condição
                </label>
                <Textarea
                  value={nodeCondition}
                  onChange={(e) => setNodeCondition(e.target.value)}
                  placeholder="Ex: user_input.includes('sim')"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para menus com opções, use o editor avançado de condições no
                  painel direito.
                </p>
              </div>
            )}

            {selectedNode?.data?.type === "action" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ação
                </label>
                <TextInput
                  value={nodeAction}
                  onChange={(e) => setNodeAction(e.target.value)}
                  placeholder="Ex: send_email, transfer_to_agent"
                />
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={saveNodeChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Salvar Alterações
          </Button>
          <Button color="gray" onClick={() => setShowNodeModal(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
