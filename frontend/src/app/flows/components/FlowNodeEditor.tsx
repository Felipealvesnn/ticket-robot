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
  const {
    nodes,
    updateNodeConditionsAndEdges,
    edges,
    addNode,
    onConnect,
    addNodeWithConnection,
  } = useFlowsStore();
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
  // Função para verificar se uma opção já tem um nó conectado
  const hasConnectedResponse = (optionValue: string) => {
    if (optionValue === "_fallback_") {
      // Verificar se existe conexão com label "outros" ou similar
      return edges.some(
        (edge) =>
          edge.source === nodeId &&
          (edge.label === "outros" ||
            edge.label === "fallback" ||
            edge.label === "padrão")
      );
    }
    return edges.some(
      (edge) => edge.source === nodeId && edge.label === `= ${optionValue}`
    );
  };

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
  const addConditionWithNode = () => {
    // Criar nova condição
    const newCondition = {
      value: (conditions.length + 1).toString(),
      operator: "equals" as const,
      target: "user_input",
      label: `${conditions.length + 1}️⃣ Nova opção`,
    };

    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);

    // Calcular posição para o novo nó (ao lado do nó atual)
    const currentNode = nodes.find((n) => n.id === nodeId);
    if (currentNode) {
      const yOffset = 100 + conditions.length * 150; // Espaçamento vertical para cada opção
      const newPosition = {
        x: currentNode.position.x + 400, // À direita do nó atual
        y: currentNode.position.y + yOffset,
      };

      // Criar nó de mensagem automaticamente com conexão
      const edgeLabel = `= ${newCondition.value}`;
      addNodeWithConnection("message", newPosition, nodeId, edgeLabel);

      // Atualizar as condições
      setTimeout(() => {
        updateNodeConditionsAndEdges(nodeId, updatedConditions);
      }, 100);
    }
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

  const handleQuickMenuSetup = () => {
    // Configuração rápida para menu básico
    const quickConditions = [
      {
        value: "1",
        operator: "equals" as const,
        target: "user_input",
        label: "1️⃣ Primeira opção",
      },
      {
        value: "2",
        operator: "equals" as const,
        target: "user_input",
        label: "2️⃣ Segunda opção",
      },
    ];
    setConditions(quickConditions);

    // Notificar usuário sobre próximos passos
    setTimeout(() => {
      alert(
        "✅ Menu criado!\n\n📝 Próximos passos:\n1. Edite o texto de cada opção\n2. Arraste conexões para os nós de destino\n3. As conexões serão rotuladas automaticamente"
      );
    }, 100);
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
              onChange={(e) => {
                setCondition(e.target.value);
                // Se selecionou "user_input", oferecer setup rápido
                if (
                  e.target.value === "user_input" &&
                  conditions.length === 0
                ) {
                  const quickSetup = confirm(
                    "Quer configurar um menu rápido?\n\nClique 'OK' para criar um menu com 2 opções básicas\nClique 'Cancelar' para configurar manualmente"
                  );
                  if (quickSetup) {
                    handleQuickMenuSetup();
                  }
                }
              }}
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
            {" "}
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Opções de Menu
              </label>
              <div className="flex gap-1">
                <button
                  onClick={addCondition}
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center px-2 py-1 border border-blue-200 rounded"
                  title="Adicionar apenas a opção (sem criar nó)"
                >
                  <svg
                    className="w-3 h-3 mr-1"
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
                  Opção
                </button>
              </div>
            </div>{" "}
            <p className="text-xs text-gray-500 mb-3">
              Configure as opções que o usuário pode escolher. Use "+ Nó" para
              criar uma mensagem de resposta automaticamente.
            </p>{" "}
            {conditions.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-xs text-gray-500 mb-3">
                  ✨ Nenhuma opção configurada
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Crie opções para que os usuários possam escolher entre
                  diferentes caminhos no seu chatbot
                </p>
                <div className="space-y-2">
                  <button
                    onClick={addConditionWithNode}
                    className="mx-auto text-white bg-blue-600 hover:bg-blue-700 text-xs px-3 py-2 rounded flex items-center"
                  >
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Criar Primeira Opção + Nó
                  </button>
                  <button
                    onClick={addCondition}
                    className="mx-auto text-blue-600 hover:text-blue-800 text-xs px-3 py-1 border border-blue-200 rounded block"
                  >
                    Ou criar apenas a opção
                  </button>
                </div>
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
                </div>{" "}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs text-gray-600 mb-1">
                      Texto da Opção (aparece no menu)
                    </label>{" "}
                    {!hasConnectedResponse(cond.value) && (
                      <button
                        onClick={() => {
                          // Criar nó de resposta para esta opção específica
                          const currentNode = nodes.find(
                            (n) => n.id === nodeId
                          );
                          if (currentNode) {
                            const yOffset = 100 + index * 150;
                            const newPosition = {
                              x: currentNode.position.x + 400,
                              y: currentNode.position.y + yOffset,
                            };

                            // Criar nó e conectar automaticamente
                            const edgeLabel = `= ${cond.value}`;
                            addNodeWithConnection(
                              "message",
                              newPosition,
                              nodeId,
                              edgeLabel
                            );
                          }
                        }}
                        className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-200 rounded"
                        title="Criar nó de resposta para esta opção"
                      >
                        📝 Criar Resposta
                      </button>
                    )}{" "}
                    {hasConnectedResponse(cond.value) && (
                      <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                        <span className="text-xs text-green-600 font-medium">
                          ✅ Resposta conectada
                        </span>
                      </div>
                    )}
                  </div>{" "}
                  <input
                    type="text"
                    value={cond.label}
                    onChange={(e) =>
                      updateCondition(index, "label", e.target.value)
                    }
                    onBlur={handleConditionsUpdate}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={`${index + 1}️⃣ Opção ${index + 1}`}
                  />
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
                      </label>{" "}
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) =>
                          updateCondition(index, "value", e.target.value)
                        }
                        onBlur={handleConditionsUpdate}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={`${index + 1}`}
                        title={`Para que o usuário digite "${
                          index + 1
                        }" e seja direcionado para esta opção, coloque "${
                          index + 1
                        }" aqui`}
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
            {/* Opção de fallback para respostas não reconhecidas */}
            {conditions.length > 0 && (
              <div className="border border-orange-200 rounded-lg p-3 mb-2 bg-orange-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-orange-700 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    Resposta Padrão (fallback)
                  </span>
                  {!hasConnectedResponse("_fallback_") && (
                    <button
                      onClick={() => {
                        const currentNode = nodes.find((n) => n.id === nodeId);
                        if (currentNode) {
                          const yOffset = 100 + conditions.length * 150 + 50;
                          const newPosition = {
                            x: currentNode.position.x + 400,
                            y: currentNode.position.y + yOffset,
                          };

                          // Criar nó para resposta padrão
                          const edgeLabel = "outros";
                          addNodeWithConnection(
                            "message",
                            newPosition,
                            nodeId,
                            edgeLabel
                          );
                        }
                      }}
                      className="text-orange-600 hover:text-orange-800 text-xs px-2 py-1 border border-orange-200 rounded"
                      title="Criar resposta para entradas não reconhecidas"
                    >
                      📝 Criar Resposta Padrão
                    </button>
                  )}
                  {hasConnectedResponse("_fallback_") && (
                    <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-md border border-orange-300">
                      <span className="text-xs text-orange-700 font-medium">
                        ✅ Resposta padrão conectada
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-orange-600 mb-2">
                  Esta resposta será enviada quando o usuário digitar algo que
                  não corresponde a nenhuma das opções acima.
                </p>
                <div className="text-xs text-orange-500 bg-orange-100 p-2 rounded border">
                  <strong>Exemplo:</strong> Se você configurou opções para "1" e
                  "2", mas o usuário digitar "3" ou "oi", esta resposta será
                  enviada.
                </div>
              </div>
            )}
            {conditions.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-xs font-medium text-blue-800 mb-2">
                  � Como conectar as opções:
                </h4>{" "}
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>
                    Use <strong>"+ Nó"</strong> para criar opção + resposta
                    automaticamente
                  </li>
                  <li>
                    Use <strong>"📝 Criar Resposta"</strong> em opções que ainda
                    não têm resposta
                  </li>
                  <li>
                    Opções conectadas mostram{" "}
                    <strong>"✅ Resposta conectada"</strong>
                  </li>
                  <li>
                    Configure o <strong>"Valor Esperado"</strong> corretamente:
                    se quer que "1" vá para primeira opção, coloque "1" no campo
                  </li>
                  <li>
                    Use <strong>"📝 Criar Resposta Padrão"</strong> para tratar
                    entradas não reconhecidas
                  </li>
                  <li>Edite o texto das mensagens criadas clicando no nó</li>
                  <li>Conexões com rótulos são criadas automaticamente</li>
                </ol>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">
                    📋 Suas opções configuradas:
                  </p>{" "}
                  <div className="mt-1 space-y-1">
                    {conditions.map((cond, index) => (
                      <div
                        key={index}
                        className={`text-xs px-2 py-1 rounded border flex items-center justify-between ${
                          hasConnectedResponse(cond.value)
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div>
                          <strong>Opção {index + 1}:</strong> {cond.label} →
                          <code className="ml-1 bg-gray-100 px-1 rounded">
                            {cond.operator === "equals"
                              ? "= "
                              : cond.operator + " "}
                            {cond.value}
                          </code>
                        </div>
                        {hasConnectedResponse(cond.value) && (
                          <span className="text-green-600 text-xs">✅</span>
                        )}
                      </div>
                    ))}{" "}
                  </div>
                  {/* Diagnóstico de problemas comuns */}
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-2">
                      🔍 Diagnóstico:
                    </p>
                    <div className="space-y-1">
                      {conditions.some((cond) => cond.value === "") && (
                        <div className="text-xs bg-yellow-50 border border-yellow-200 px-2 py-1 rounded">
                          ⚠️ <strong>Problema:</strong> Algumas opções não têm
                          "Valor Esperado" configurado
                        </div>
                      )}
                      {conditions.length > 0 &&
                        conditions.every((cond) =>
                          hasConnectedResponse(cond.value)
                        ) &&
                        !hasConnectedResponse("_fallback_") && (
                          <div className="text-xs bg-yellow-50 border border-yellow-200 px-2 py-1 rounded">
                            💡 <strong>Sugestão:</strong> Configure uma
                            "Resposta Padrão" para entradas não reconhecidas
                          </div>
                        )}
                      {conditions.length >= 2 &&
                        new Set(conditions.map((c) => c.value)).size <
                          conditions.length && (
                          <div className="text-xs bg-red-50 border border-red-200 px-2 py-1 rounded">
                            ❌ <strong>Erro:</strong> Existem opções com o mesmo
                            "Valor Esperado"
                          </div>
                        )}
                      {conditions.length > 0 && (
                        <div className="text-xs bg-green-50 border border-green-200 px-2 py-1 rounded">
                          ✅ <strong>Status:</strong> {conditions.length}{" "}
                          opção(ões) configurada(s)
                        </div>
                      )}
                    </div>
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
