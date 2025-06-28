"use client";

import { ChevronDown, ExternalLink, Link, Plus, Trash2 } from "lucide-react";
import { FC } from "react";
import {
  Condition,
  fieldOptions,
  nodeTypeOptions,
  operatorLabels,
} from "./types";

interface ConditionsTabProps {
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
      | "ticket",
    position: { x: number; y: number },
    sourceNodeId: string,
    edgeLabel?: string
  ) => string;
}

export const ConditionsTab: FC<ConditionsTabProps> = ({
  node,
  nodes,
  onUpdateProperty,
  onAddNodeWithConnection,
}) => {
  const addCondition = () => {
    const currentConditions = node.data?.conditions || [];
    const newCondition: Condition = {
      id: Date.now().toString(),
      field: "message",
      operator: "equals",
      value: "",
      label: `Condição ${currentConditions.length + 1}`,
    };

    onUpdateProperty("conditions", [...currentConditions, newCondition]);
  };

  const updateCondition = (
    conditionId: string,
    updates: Partial<Condition>
  ) => {
    const currentConditions = node.data?.conditions || [];
    const updatedConditions = currentConditions.map((condition: Condition) =>
      condition.id === conditionId ? { ...condition, ...updates } : condition
    );
    onUpdateProperty("conditions", updatedConditions);
  };

  const removeCondition = (conditionId: string) => {
    const currentConditions = node.data?.conditions || [];
    const filteredConditions = currentConditions.filter(
      (condition: Condition) => condition.id !== conditionId
    );
    onUpdateProperty("conditions", filteredConditions);
  };

  const createNodeFromCondition = (conditionId: string, nodeType: string) => {
    if (!node) return;

    const condition = node.data?.conditions?.find(
      (c: Condition) => c.id === conditionId
    );
    if (!condition) return;

    // Calcular posição para o novo nó
    const newPosition = {
      x: node.position.x + 300,
      y: node.position.y + 100,
    };

    // Criar o novo nó conectado
    const newNodeId = onAddNodeWithConnection(
      nodeType as any,
      newPosition,
      node.id,
      condition.label || condition.value
    );

    // Atualizar a condição
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

  return (
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
          {node.data.conditions.map((condition: Condition, index: number) => {
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
                        updateCondition(condition.id, { field: e.target.value })
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
                      {Object.entries(operatorLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
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
                    Valor
                  </label>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(condition.id, { value: e.target.value })
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
                      updateCondition(condition.id, { label: e.target.value })
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
                      <ExternalLink size={14} className="text-green-600" />
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
                            <option key={option.value} value={option.value}>
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
          })}
        </div>
      )}
    </div>
  );
};
