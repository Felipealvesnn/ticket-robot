"use client";

import { useFlowsStore } from "@/store";
import {
  Copy,
  Download,
  Eye,
  GitBranch,
  MessageSquare,
  Play,
  StopCircle,
  Upload,
  Zap,
} from "lucide-react";

export const FlowBuilderToolbar = () => {
  const { addNode, currentFlow } = useFlowsStore();

  const nodeTypes = [
    {
      type: "start",
      label: "Início",
      icon: Play,
      color: "bg-green-100 text-green-700",
    },
    {
      type: "message",
      label: "Mensagem",
      icon: MessageSquare,
      color: "bg-blue-100 text-blue-700",
    },
    {
      type: "condition",
      label: "Condição",
      icon: GitBranch,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      type: "action",
      label: "Ação",
      icon: Zap,
      color: "bg-purple-100 text-purple-700",
    },
    {
      type: "end",
      label: "Fim",
      icon: StopCircle,
      color: "bg-red-100 text-red-700",
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section - Node Types */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600 mr-2">
            Adicionar Nó:
          </span>
          {nodeTypes.map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => addNode(type as any, { x: 250, y: 100 })}
              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:scale-105 ${color}`}
              title={`Adicionar ${label}`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>

          <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Copy className="w-3 h-3" />
            <span>Duplicar</span>
          </button>

          <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Download className="w-3 h-3" />
            <span>Exportar</span>
          </button>

          <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Upload className="w-3 h-3" />
            <span>Importar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
