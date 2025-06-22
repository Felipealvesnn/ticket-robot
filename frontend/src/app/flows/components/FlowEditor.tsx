"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  NodeTypes,
} from "reactflow";

import "reactflow/dist/style.css";

// Flowbite React components
import { Button, Card, TextInput, Tooltip } from "flowbite-react";
import {
  HiArrowLeft,
  HiEye,
  HiOutlineBolt,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentCheck,
  HiOutlineEyeSlash,
  HiOutlinePlay,
  HiOutlineQuestionMarkCircle,
  HiOutlineXMark,
  HiPlay,
} from "react-icons/hi2";

import { useFlowsStore } from "@/store/flows";
import CustomNode from "./CustomNode";
import FlowNodeEditor from "./FlowNodeEditor";

interface FlowEditorProps {
  onBack: () => void;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export default function FlowEditor({ onBack }: FlowEditorProps) {
  const {
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
    saveCurrentFlow,
    testFlow,
  } = useFlowsStore();

  const [isTestMode, setIsTestMode] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testResults, setTestResults] = useState<string[]>([]);
  const [showNodePanel, setShowNodePanel] = useState(true);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const handleAddNode = (
    type: "start" | "message" | "condition" | "action" | "end"
  ) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };
    addNode(type, position);
  };

  const handleSave = () => {
    saveCurrentFlow();
    alert("Flow salvo com sucesso!");
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;

    setIsTestMode(true);
    try {
      const results = await testFlow(testInput);
      setTestResults(results);
    } catch (error) {
      console.error("Erro ao testar flow:", error);
    } finally {
      setIsTestMode(false);
    }
  };
  if (!currentFlow) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum flow selecionado
            </h2>
            <p className="text-gray-600 mb-4">
              Selecione um flow para editar ou crie um novo.
            </p>
            <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
              <HiArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            onClick={onBack}
            color="light"
            size="sm"
            className="!p-2 hover:bg-gray-100 transition-colors"
          >
            <HiArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {currentFlow.name}
              </h1>
              <p className="text-sm text-gray-600">{currentFlow.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowNodePanel(!showNodePanel)}
            color="light"
            size="sm"
            className="border border-gray-300 hover:border-gray-400 transition-colors"
          >
            {showNodePanel ? (
              <>
                <HiOutlineEyeSlash className="mr-2 h-4 w-4" />
                Ocultar Painel
              </>
            ) : (
              <>
                <HiEye className="mr-2 h-4 w-4" />
                Mostrar Painel
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-md"
            size="sm"
          >
            <HiOutlineDocumentCheck className="mr-2 h-4 w-4" />
            Salvar Flow
          </Button>
        </div>
      </div>{" "}
      <div className="flex-1 flex min-h-0">
        {/* Node Panel */}
        {showNodePanel && (
          <div className="w-80 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg overflow-y-auto flex-shrink-0">
            <div className="p-6 space-y-6">
              {/* Add Nodes */}
              <Card className="bg-gradient-to-br from-gray-50 to-white border-0 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <HiOutlinePlay className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Elementos do Flow
                    </h3>
                    <p className="text-xs text-gray-500">
                      Arraste para o canvas ou clique para adicionar
                    </p>
                  </div>
                </div>

                {/* Grid de elementos mais espaçado e organizado */}
                <div className="space-y-4">
                  {/* Linha 1: Início e Fim */}
                  <div className="grid grid-cols-2 gap-3">
                    <Tooltip content="Ponto de início do chatbot">
                      <Button
                        onClick={() => handleAddNode("start")}
                        color="light"
                        className="group !p-4 h-24 w-full flex-col justify-center border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-200 hover:scale-105"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <HiOutlinePlay className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-sm font-medium text-green-700">
                          Início
                        </div>
                        <div className="text-xs text-green-500 opacity-75">
                          Começar aqui
                        </div>
                      </Button>
                    </Tooltip>

                    <Tooltip content="Finalizar conversa">
                      <Button
                        onClick={() => handleAddNode("end")}
                        color="light"
                        className="group !p-4 h-24 w-full flex-col justify-center border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all duration-200 hover:scale-105"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-full mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <HiOutlineXMark className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="text-sm font-medium text-red-700">
                          Fim
                        </div>
                        <div className="text-xs text-red-500 opacity-75">
                          Encerrar
                        </div>
                      </Button>
                    </Tooltip>
                  </div>

                  {/* Linha 2: Mensagem */}
                  <div>
                    <Tooltip content="Enviar mensagem para o usuário">
                      <Button
                        onClick={() => handleAddNode("message")}
                        color="light"
                        className="group !p-4 h-24 w-full flex-col justify-center border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium text-blue-700">
                          Mensagem
                        </div>
                        <div className="text-xs text-blue-500 opacity-75">
                          Enviar texto, imagem ou áudio
                        </div>
                      </Button>
                    </Tooltip>
                  </div>

                  {/* Linha 3: Condição */}
                  <div>
                    <Tooltip content="Criar menus e condições inteligentes">
                      <Button
                        onClick={() => handleAddNode("condition")}
                        color="light"
                        className="group !p-4 h-24 w-full flex-col justify-center border-2 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-200 hover:scale-105"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <HiOutlineQuestionMarkCircle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="text-sm font-medium text-yellow-700">
                          Menu/Condição
                        </div>
                        <div className="text-xs text-yellow-600 opacity-75">
                          Opções para o usuário escolher
                        </div>
                      </Button>
                    </Tooltip>
                  </div>

                  {/* Linha 4: Ação */}
                  <div>
                    <Tooltip content="Executar ações automaticamente">
                      <Button
                        onClick={() => handleAddNode("action")}
                        color="light"
                        className="group !p-4 h-24 w-full flex-col justify-center border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 hover:scale-105"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <HiOutlineBolt className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-sm font-medium text-purple-700">
                          Ação
                        </div>
                        <div className="text-xs text-purple-600 opacity-75">
                          Integrar sistemas, salvar dados
                        </div>
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                {/* Dica visual */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 text-blue-500 mt-0.5">💡</div>
                    <div>
                      <p className="text-xs font-medium text-blue-800">
                        Dica Rápida
                      </p>
                      <p className="text-xs text-blue-600">
                        Comece sempre com "Início", adicione "Mensagem" e use
                        "Menu/Condição" para criar opções interativas.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
              {/* Node Editor */}
              {selectedNodeId && (
                <FlowNodeEditor
                  nodeId={selectedNodeId}
                  onUpdate={updateNodeData}
                  onDelete={deleteNode}
                />
              )}{" "}
              {/* Test Flow */}
              <Card className="bg-gradient-to-br from-indigo-50 to-white border-0 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <HiPlay className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Teste Rápido
                    </h3>
                    <p className="text-xs text-gray-500">
                      Simule uma conversa com seu chatbot
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <TextInput
                      type="text"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Digite: Olá, preciso de ajuda..."
                      sizing="md"
                      className="pr-12"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      💬
                    </div>
                  </div>

                  <Button
                    onClick={handleTest}
                    disabled={isTestMode || !testInput.trim()}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0"
                    size="md"
                  >
                    {isTestMode ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Testando...
                      </div>
                    ) : (
                      <>
                        <HiPlay className="mr-2 h-4 w-4" />
                        Simular Conversa
                      </>
                    )}
                  </Button>

                  {testResults.length > 0 && (
                    <div className="mt-4 p-4 bg-white border border-green-200 rounded-lg shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs">🤖</span>
                        </div>
                        <h4 className="text-sm font-medium text-green-800">
                          Resposta do Bot:
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {testResults.map((result, index) => (
                          <div
                            key={index}
                            className="text-sm p-3 bg-green-50 rounded-lg border-l-4 border-green-400"
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {testResults.length === 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎯</div>
                        <p className="text-xs text-gray-500">
                          Digite uma mensagem acima e clique em "Simular" para
                          testar seu chatbot
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
