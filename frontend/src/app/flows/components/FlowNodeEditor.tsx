"use client";

import { useFlowsStore } from "@/store/flows";
import { useEffect, useState } from "react";

interface FlowNodeEditorProps {
  nodeId: string;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}

export default function FlowNodeEditor({
  nodeId,
  onUpdate,
  onDelete,
}: FlowNodeEditorProps) {
  const { nodes, updateNodeConditionsAndEdges, edges } = useFlowsStore();
  const node = nodes.find((n) => n.id === nodeId);
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [condition, setCondition] = useState("");
  const [action, setAction] = useState("");
  const [delay, setDelay] = useState(0);
  const [conditions, setConditions] = useState<
    Array<{
      value: string;
      operator: "equals" | "contains" | "regex" | "range";
      target: string;
      label: string;
    }>
  >([]);
  useEffect(() => {
    if (node) {
      setLabel(node.data.label || "");
      setMessage(node.data.message || "");
      setCondition(node.data.condition || "");
      setAction(node.data.action || "");
      setDelay(node.data.delay || 0);
      setConditions(node.data.conditions || []);
    }
  }, [node]);

  if (!node) return null;
  const handleUpdate = () => {
    onUpdate(nodeId, {
      label,
      message: message || undefined,
      condition: condition || undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      action: action || undefined,
      delay: delay || undefined,
    });
  };

  const addCondition = () => {
    const newCondition = {
      value: "",
      operator: "equals" as const,
      target: "user_input",
      label: `Opção ${conditions.length + 1}`,
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (index: number, field: string, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };
  const handleConditionsUpdate = () => {
    // Update the node with the new conditions and clean up old edges
    updateNodeConditionsAndEdges(nodeId, conditions);
    handleUpdate();
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este nó?")) {
      onDelete(nodeId);
    }
  };

  const getNodeType = () => {
    if (node.data.message) return "message";
    if (node.data.condition) return "condition";
    if (node.data.action) return "action";
    return "other";
  };

  const nodeType = getNodeType();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Editar Nó</h3>
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-800 transition-colors duration-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nome do Nó
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleUpdate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome do nó..."
          />
        </div>
        {/* Message Content */}
        {(nodeType === "message" || message) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mensagem
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onBlur={handleUpdate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite a mensagem que será enviada..."
              rows={3}
            />
          </div>
        )}{" "}
        {/* Condition */}
        {(nodeType === "condition" || condition) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Condição
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              onBlur={handleUpdate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma condição</option>
              <option value="user_input">Aguardar resposta do usuário</option>
              <option value="contains_keyword">Contém palavra-chave</option>
              <option value="is_number">É um número</option>
              <option value="is_email">É um email</option>
              <option value="is_phone">É um telefone</option>
              <option value="time_based">Baseado no horário</option>
              <option value="user_data">Dados do usuário</option>
            </select>
          </div>
        )}
        {/* Dynamic Conditions - Menu Options */}
        {(nodeType === "condition" || condition === "user_input") && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Opções de Menu
              </label>
              <button
                onClick={addCondition}
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Adicionar Opção
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Configure as opções que o usuário pode escolher (ex: "digite 1
              para vendas")
            </p>
            {conditions.length === 0 && (
              <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">
                  Nenhuma opção configurada
                </p>
                <button
                  onClick={addCondition}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Clique para adicionar a primeira opção
                </button>
              </div>
            )}
            {conditions.map((cond, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    Opção {index + 1}
                  </span>
                  <button
                    onClick={() => removeCondition(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Texto da Opção (aparece no menu)
                    </label>
                    <input
                      type="text"
                      value={cond.label}
                      onChange={(e) =>
                        updateCondition(index, "label", e.target.value)
                      }
                      onBlur={handleConditionsUpdate}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Ex: 1️⃣ Falar com vendas"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Operador
                      </label>
                      <select
                        value={cond.operator}
                        onChange={(e) =>
                          updateCondition(index, "operator", e.target.value)
                        }
                        onBlur={handleConditionsUpdate}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="equals">Igual a</option>
                        <option value="contains">Contém</option>
                        <option value="regex">Regex</option>
                        <option value="range">Entre valores</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Valor Esperado
                      </label>
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) =>
                          updateCondition(index, "value", e.target.value)
                        }
                        onBlur={handleConditionsUpdate}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Ex: 1, vendas, ^[1-3]$"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Campo de Entrada
                    </label>
                    <select
                      value={cond.target}
                      onChange={(e) =>
                        updateCondition(index, "target", e.target.value)
                      }
                      onBlur={handleConditionsUpdate}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="user_input">Resposta do usuário</option>
                      <option value="user_name">Nome do usuário</option>
                      <option value="user_phone">Telefone do usuário</option>
                      <option value="message_time">Horário da mensagem</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}{" "}
            {conditions.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-xs font-medium text-blue-800 mb-2">
                  � Como conectar as opções:
                </h4>{" "}
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>
                    Arraste da <strong>borda direita</strong> deste nó para o nó
                    de destino
                  </li>
                  <li>
                    O <strong>rótulo da conexão</strong> será criado
                    automaticamente
                  </li>
                  <li>
                    Para editar manualmente, clique na conexão após criá-la
                  </li>
                  <li>
                    Use múltiplas conexões para diferentes destinos por opção
                  </li>
                </ol>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">
                    📋 Suas opções configuradas:
                  </p>
                  <div className="mt-1 space-y-1">
                    {conditions.map((cond, index) => (
                      <div
                        key={index}
                        className="text-xs bg-white px-2 py-1 rounded border"
                      >
                        <strong>Opção {index + 1}:</strong> {cond.label} →
                        <code className="ml-1 bg-gray-100 px-1 rounded">
                          {cond.operator === "equals"
                            ? "= "
                            : cond.operator + " "}
                          {cond.value}
                        </code>
                      </div>
                    ))}{" "}
                  </div>
                </div>
              </div>
            )}
            {/* Show existing connections */}
            {conditions.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-xs font-medium text-green-800 mb-2">
                  🔌 Conexões existentes:
                </h4>
                {edges.filter((edge) => edge.source === nodeId).length === 0 ? (
                  <p className="text-xs text-green-600">
                    Nenhuma conexão criada ainda
                  </p>
                ) : (
                  <div className="space-y-1">
                    {edges
                      .filter((edge) => edge.source === nodeId)
                      .map((edge, index) => (
                        <div
                          key={edge.id}
                          className="text-xs bg-white px-2 py-1 rounded border"
                        >
                          <strong>Conexão {index + 1}:</strong>
                          <span className="ml-1">
                            {edge.label ? (
                              <code className="bg-gray-100 px-1 rounded">
                                {edge.label}
                              </code>
                            ) : (
                              <span className="text-gray-500">sem rótulo</span>
                            )}
                          </span>
                          → Nó {edge.target}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Action */}
        {(nodeType === "action" || action) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ação
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              onBlur={handleUpdate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma ação</option>
              <option value="send_to_human">Transferir para humano</option>
              <option value="save_data">Salvar dados</option>
              <option value="send_email">Enviar email</option>
              <option value="create_ticket">Criar ticket</option>
              <option value="schedule_message">Agendar mensagem</option>
              <option value="add_tag">Adicionar tag</option>
              <option value="webhook">Chamar webhook</option>
            </select>
          </div>
        )}
        {/* Delay */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Delay (segundos)
          </label>
          <input
            type="number"
            min="0"
            max="300"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            onBlur={handleUpdate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tempo de espera antes de executar este nó
          </p>
        </div>
        {/* Node Info */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div>ID: {nodeId}</div>
            <div>Tipo: {nodeType}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
