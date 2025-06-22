"use client";

import {
  Calculator,
  Clock,
  Database,
  FileText,
  GitBranch,
  Image,
  Link,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Play,
  StopCircle,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import { FC, memo } from "react";
import { Handle, NodeProps, Position } from "reactflow";

interface CustomNodeData {
  label?: string;
  description?: string;
  message?: string;
  type?: string;
  conditions?: any[];
  isValid?: boolean;
  hasError?: boolean;
}

const getNodeIcon = (type: string) => {
  const icons = {
    message: MessageSquare,
    condition: GitBranch,
    delay: Clock,
    image: Image,
    file: FileText,
    start: Play,
    end: StopCircle,
    webhook: Link,
    database: Database,
    calculation: Calculator,
    email: Mail,
    phone: Phone,
    automation: Zap,
    segment: Users,
    tag: Tag,
  };
  return icons[type as keyof typeof icons] || MessageSquare;
};

const getNodeDefaultLabel = (type: string) => {
  const labels = {
    message: "Mensagem de Texto",
    condition: "Condição",
    delay: "Aguardar",
    image: "Imagem",
    file: "Arquivo",
    start: "Início",
    end: "Fim",
    webhook: "Webhook",
    database: "Banco de Dados",
    calculation: "Calcular",
    email: "Enviar Email",
    phone: "Fazer Ligação",
    automation: "Automação",
    segment: "Segmentar",
    tag: "Adicionar Tag",
  };
  return labels[type as keyof typeof labels] || "Nó";
};

const getNodeColor = (type: string) => {
  const colors = {
    message: "bg-blue-500",
    condition: "bg-orange-500",
    delay: "bg-yellow-500",
    image: "bg-green-500",
    file: "bg-purple-500",
    start: "bg-green-600",
    end: "bg-red-500",
    webhook: "bg-indigo-500",
    database: "bg-gray-500",
    calculation: "bg-pink-500",
    email: "bg-red-600",
    phone: "bg-green-600",
    automation: "bg-yellow-600",
    segment: "bg-blue-600",
    tag: "bg-teal-500",
  };
  return colors[type as keyof typeof colors] || "bg-blue-500";
};

const getNodeBorderColor = (
  type: string,
  selected?: boolean,
  hasError?: boolean
) => {
  if (hasError) return "border-red-300";
  if (selected) return "border-blue-400";

  const colors = {
    message: "border-blue-200",
    condition: "border-orange-200",
    delay: "border-yellow-200",
    image: "border-green-200",
    file: "border-purple-200",
    start: "border-green-300",
    end: "border-red-200",
    webhook: "border-indigo-200",
    database: "border-gray-200",
    calculation: "border-pink-200",
    email: "border-red-300",
    phone: "border-green-300",
    automation: "border-yellow-300",
    segment: "border-blue-300",
    tag: "border-teal-200",
  };
  return colors[type as keyof typeof colors] || "border-blue-200";
};

export const CustomNode: FC<NodeProps<CustomNodeData>> = memo(
  ({ data, selected, id }) => {
    const Icon = getNodeIcon(data.type || "message");
    const nodeType = data.type || "message";
    const hasMultipleOutputs = nodeType === "condition";
    const isStartNode = nodeType === "start";
    const isEndNode = nodeType === "end";

    return (
      <div
        className={`
        relative bg-white rounded-lg shadow-sm border-2 transition-all duration-200
        ${getNodeBorderColor(nodeType, selected, data.hasError)}
        ${selected ? "shadow-md scale-105" : "hover:shadow-md"}
        ${data.hasError ? "animate-pulse" : ""}
        min-w-[200px] max-w-[300px]
      `}
      >
        {/* Input Handle - Não mostrar no nó de início */}
        {!isStartNode && (
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
          />
        )}
        {/* Header */}
        <div
          className={`
        flex items-center justify-between p-3 rounded-t-lg
        ${getNodeColor(nodeType)} text-white
      `}
        >
          <div className="flex items-center gap-2">
            <Icon size={16} />{" "}
            <span className="text-sm font-medium">
              {data.label || getNodeDefaultLabel(nodeType)}
            </span>
          </div>
          <button className="p-1 hover:bg-white/20 rounded transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
        {/* Content */}
        <div className="p-3">
          {/* Description */}
          {data.description && (
            <p className="text-sm text-gray-600 mb-2">{data.description}</p>
          )}

          {/* Message Content */}
          {data.message && (
            <div className="bg-gray-50 rounded p-2 mb-2">
              <p className="text-sm text-gray-700 line-clamp-3">
                {data.message}
              </p>
            </div>
          )}

          {/* Conditions Preview */}
          {nodeType === "condition" &&
            data.conditions &&
            data.conditions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium">Condições:</p>
                {data.conditions.slice(0, 2).map((condition, index) => (
                  <div
                    key={index}
                    className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded"
                  >
                    {condition.label || `Condição ${index + 1}`}
                  </div>
                ))}
                {data.conditions.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{data.conditions.length - 2} mais...
                  </div>
                )}
              </div>
            )}

          {/* Status Indicators */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {!data.isValid && (
                <div
                  className="w-2 h-2 bg-red-400 rounded-full"
                  title="Configuração incompleta"
                />
              )}
              {data.isValid && (
                <div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  title="Configurado corretamente"
                />
              )}
            </div>

            {nodeType !== "end" && (
              <div className="text-xs text-gray-400">ID: {id.slice(-4)}</div>
            )}
          </div>
        </div>{" "}
        {/* Output Handles */}
        {!isEndNode && (
          <>
            {hasMultipleOutputs ? (
              <>
                {" "}
                {/* Render handles for each condition */}
                {data.conditions && data.conditions.length > 0 ? (
                  <>
                    {data.conditions.map((condition: any, index: number) => {
                      const handleId = `condition-${condition.id || index}`;
                      const totalConditions = data.conditions?.length || 0;
                      const spacing = 80 / (totalConditions + 1); // Distribute evenly across 80% of width
                      const leftPosition = 10 + spacing * (index + 1); // Start at 10% and distribute

                      return (
                        <Handle
                          key={handleId}
                          type="source"
                          position={Position.Bottom}
                          id={handleId}
                          style={{ left: `${leftPosition}%` }}
                          className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
                        />
                      );
                    })}

                    {/* Default "false" handle for when no conditions match */}
                    <Handle
                      type="source"
                      position={Position.Bottom}
                      id="default"
                      style={{ left: "90%" }}
                      className="w-3 h-3 !bg-gray-500 !border-2 !border-white"
                    />

                    {/* Labels for condition outputs */}
                    <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-2 text-xs">
                      {data.conditions.map((condition: any, index: number) => {
                        const totalConditions = data.conditions?.length || 0;
                        const spacing = 80 / (totalConditions + 1);
                        const leftPosition = 10 + spacing * (index + 1);

                        return (
                          <span
                            key={index}
                            className="text-blue-600 font-medium text-center max-w-16 truncate"
                            style={{
                              position: "absolute",
                              left: `${leftPosition}%`,
                              transform: "translateX(-50%)",
                            }}
                            title={condition.label || `Condição ${index + 1}`}
                          >
                            {condition.label || `C${index + 1}`}
                          </span>
                        );
                      })}
                      <span
                        className="text-gray-600 font-medium text-center absolute"
                        style={{
                          left: "90%",
                          transform: "translateX(-50%)",
                        }}
                        title="Padrão (nenhuma condição atendida)"
                      >
                        Padrão
                      </span>
                    </div>
                  </>
                ) : (
                  // Fallback for conditions without proper data - show simple yes/no
                  <>
                    <Handle
                      type="source"
                      position={Position.Bottom}
                      id="true"
                      style={{ left: "30%" }}
                      className="w-3 h-3 !bg-green-500 !border-2 !border-white"
                    />
                    <Handle
                      type="source"
                      position={Position.Bottom}
                      id="false"
                      style={{ left: "70%" }}
                      className="w-3 h-3 !bg-red-500 !border-2 !border-white"
                    />
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-4">
                      <span className="text-xs text-green-600 font-medium">
                        Sim
                      </span>
                      <span className="text-xs text-red-600 font-medium">
                        Não
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
              />
            )}
          </>
        )}
      </div>
    );
  }
);
