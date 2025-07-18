"use client";

import {
  Calendar,
  Clock,
  Copy,
  Edit3,
  GitBranch,
  MessageSquare,
  Pause,
  Play,
  Trash2,
  Users,
} from "lucide-react";
import { FC } from "react";

interface FlowCardProps {
  flow: any;
  onEdit: (flowId: string) => void;
  onToggleActive: (flowId: string, isActive: boolean) => void;
  onDuplicate: (flowId: string) => void;
  onDelete: (flowId: string) => void;
}

export const FlowCard: FC<FlowCardProps> = ({
  flow,
  onEdit,
  onToggleActive,
  onDuplicate,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFlowStats = (flow: any) => {
    const nodeCount = flow.nodes?.length || 0;
    const edgeCount = flow.edges?.length || 0;
    const conditionNodes =
      flow.nodes?.filter((n: any) => n.data?.type === "condition").length || 0;

    return { nodeCount, edgeCount, conditionNodes };
  };

  const stats = getFlowStats(flow);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`flex-shrink-0 w-3 h-3 rounded-full ${
                flow.isActive ? "bg-green-400" : "bg-gray-400"
              }`}
            />
            <h3 className="ml-3 text-lg font-medium text-gray-900 truncate">
              {flow.name}
            </h3>
          </div>
          <button
            onClick={() => onToggleActive(flow.id, flow.isActive)}
            className={`p-1 rounded-full transition-colors ${
              flow.isActive
                ? "text-green-600 hover:bg-green-50"
                : "text-gray-400 hover:bg-gray-50"
            }`}
            title={flow.isActive ? "Desativar flow" : "Ativar flow"}
          >
            {flow.isActive ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {flow.description || "Sem descrição"}
        </p>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center text-gray-500">
            <MessageSquare className="w-4 h-4 mr-1" />
            {stats.nodeCount} nós
          </div>
          <div className="flex items-center text-gray-500">
            <GitBranch className="w-4 h-4 mr-1" />
            {stats.conditionNodes} condições
          </div>
          <div className="flex items-center text-gray-500">
            <Users className="w-4 h-4 mr-1" />
            {flow.triggers?.length || 0} gatilhos
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            Criado: {formatDate(flow.createdAt)}
          </div>
          {flow.updatedAt !== flow.createdAt && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Atualizado: {formatDate(flow.updatedAt)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => onEdit(flow.id)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Editar
          </button>

          <div className="flex space-x-2">
            <button
              onClick={() => onDuplicate(flow.id)}
              className="p-2 border border-gray-300 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-50 transition-colors"
              title="Duplicar flow"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(flow.id)}
              className="p-2 border border-gray-300 rounded-md text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Excluir flow"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
