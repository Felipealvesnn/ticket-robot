"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
} from "reactflow";

import "reactflow/dist/style.css";

import { useFlowsStore } from "@/store/flows";
import FlowNodeEditor from "./FlowNodeEditor";
import CustomNode from "./CustomNode";

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
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum flow selecionado
          </h2>
          <p className="text-gray-600 mb-4">
            Selecione um flow para editar ou crie um novo.
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Voltar para Lista
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentFlow.name}
            </h1>
            <p className="text-sm text-gray-600">{currentFlow.description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNodePanel(!showNodePanel)}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            {showNodePanel ? "Ocultar Painel" : "Mostrar Painel"}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Salvar
          </button>
        </div>
      </div>{" "}
      <div className="flex-1 flex min-h-0">
        {/* Node Panel */}
        {showNodePanel && (
          <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
            <div className="space-y-6">
              {/* Add Nodes */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Adicionar Nós
                </h3>
                {/* Node Types Legend */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">
                    Tipos de Nós:
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-200 rounded-full"></div>
                      <span>Início/Fim - Círculos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-200 rounded"></div>
                      <span>Mensagem - Retângulos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-200 transform rotate-45"></div>
                      <span>Condição - Losangos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 bg-purple-200"
                        style={{
                          clipPath:
                            "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
                        }}
                      ></div>
                      <span>Ação - Hexágonos</span>
                    </div>
                  </div>
                </div>{" "}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddNode("start")}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full mb-2 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-medium">Início</div>
                  </button>

                  <button
                    onClick={() => handleAddNode("message")}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded mb-2 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-medium">Mensagem</div>
                  </button>

                  <button
                    onClick={() => handleAddNode("condition")}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-yellow-100 rounded mb-2 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-medium">Condição</div>
                  </button>

                  <button
                    onClick={() => handleAddNode("action")}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded mb-2 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-medium">Ação</div>
                  </button>

                  <button
                    onClick={() => handleAddNode("end")}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded mb-2 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-medium">Fim</div>
                  </button>
                </div>
              </div>

              {/* Node Editor */}
              {selectedNodeId && (
                <FlowNodeEditor
                  nodeId={selectedNodeId}
                  onUpdate={updateNodeData}
                  onDelete={deleteNode}
                />
              )}

              {/* Test Flow */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Testar Flow
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Digite uma mensagem de teste..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleTest}
                    disabled={isTestMode || !testInput.trim()}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isTestMode ? "Testando..." : "Testar"}
                  </button>

                  {testResults.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <h4 className="text-xs font-medium text-gray-900 mb-2">
                        Resultado:
                      </h4>
                      <div className="space-y-2">
                        {testResults.map((result, index) => (
                          <div
                            key={index}
                            className="text-xs text-gray-700 p-2 bg-white rounded border"
                          >
                            🤖 {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
