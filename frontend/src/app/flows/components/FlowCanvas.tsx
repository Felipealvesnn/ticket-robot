"use client";

import { useFlowsStore } from "@/store/flows";
import { Button } from "flowbite-react";
import { HiChatBubbleLeftRight, HiEye, HiPlay } from "react-icons/hi2";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  NodeTypes,
} from "reactflow";
import CustomChatNode from "./CustomChatNode";

const nodeTypes: NodeTypes = {
  custom: CustomChatNode,
};

interface FlowCanvasProps {
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onSetLeftPanel: (panel: "flows" | "templates" | "elements") => void;
  onShowCreateModal: () => void;
}

export default function FlowCanvas({
  onNodeClick,
  onSetLeftPanel,
  onShowCreateModal,
}: FlowCanvasProps) {
  const { currentFlow, nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useFlowsStore();

  return (
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
                  onClick={() => onSetLeftPanel("templates")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Ver Templates
                </Button>
                <Button
                  color="gray"
                  onClick={onShowCreateModal}
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
  );
}
