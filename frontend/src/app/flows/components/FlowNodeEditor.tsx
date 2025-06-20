"use client";

import { useState, useEffect } from "react";
import { useFlowsStore } from "@/store/flows";

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
  const { nodes } = useFlowsStore();
  const node = nodes.find((n) => n.id === nodeId);

  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [condition, setCondition] = useState("");
  const [action, setAction] = useState("");
  const [delay, setDelay] = useState(0);

  useEffect(() => {
    if (node) {
      setLabel(node.data.label || "");
      setMessage(node.data.message || "");
      setCondition(node.data.condition || "");
      setAction(node.data.action || "");
      setDelay(node.data.delay || 0);
    }
  }, [node]);

  if (!node) return null;

  const handleUpdate = () => {
    onUpdate(nodeId, {
      label,
      message: message || undefined,
      condition: condition || undefined,
      action: action || undefined,
      delay: delay || undefined,
    });
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
        )}

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
