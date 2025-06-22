"use client";

import { useFlowsStore } from "@/store/flows";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
  nodeId?: string;
}

export default function FlowPreview() {
  const { currentFlow, nodes, edges } = useFlowsStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startSimulation = () => {
    setMessages([]);
    setUserInput("");
    setIsSimulating(true);

    // Buscar nó inicial
    const startNode = nodes.find((node) => node.data.type === "start");
    if (startNode) {
      setCurrentNode(startNode.id);

      // Adicionar mensagem inicial se existir
      if (startNode.data.message) {
        addBotMessage(startNode.data.message, startNode.id);
      }

      // Verificar próximo nó automaticamente
      setTimeout(() => {
        processNode(startNode.id);
      }, 1000);
    }
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setCurrentNode(null);
    setMessages([]);
    setUserInput("");
  };

  const addBotMessage = (text: string, nodeId?: string) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      text,
      sender: "bot",
      timestamp: new Date(),
      nodeId,
    };
    setMessages((prev) => [...prev, message]);
  };

  const addUserMessage = (text: string) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const processNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return; // Se é um nó de condição, mostrar as opções
    if (node.data.type === "condition" && node.data.conditions) {
      let optionsText = "📋 *Escolha uma opção:*\n\n";
      node.data.conditions.forEach((condition: any) => {
        optionsText += `${condition.label}\n`;
      });

      // Verificar se há fallback
      const fallbackEdge = edges.find(
        (edge) =>
          edge.source === nodeId &&
          (edge.label === "outros" || edge.label === "fallback")
      );

      if (fallbackEdge) {
        optionsText += "\n_Ou digite qualquer outra coisa..._";
      }

      addBotMessage(optionsText, nodeId);
    } else {
      // Se não é um nó de condição, ir para o próximo automaticamente
      const nextEdge = edges.find((edge) => edge.source === nodeId);
      if (nextEdge) {
        setTimeout(() => {
          const nextNode = nodes.find((n) => n.id === nextEdge.target);
          if (nextNode) {
            setCurrentNode(nextNode.id);
            if (nextNode.data.message) {
              addBotMessage(nextNode.data.message, nextNode.id);
            }
            processNode(nextNode.id);
          }
        }, 1500);
      } else {
        // Fim do flow
        setTimeout(() => {
          addBotMessage(
            "✅ *Fim da conversa*\n\nEste é o final do flow configurado.",
            nodeId
          );
          setIsSimulating(false);
        }, 1000);
      }
    }
  };

  const handleUserMessage = () => {
    if (!userInput.trim() || !currentNode) return;

    addUserMessage(userInput);

    const node = nodes.find((n) => n.id === currentNode);
    if (!node || !node.data.conditions) {
      setUserInput("");
      return;
    }

    // Buscar condição correspondente
    let matchedCondition = null;
    let matchedEdge = null;

    for (const condition of node.data.conditions) {
      if (condition.operator === "equals" && condition.value === userInput) {
        matchedCondition = condition;
        matchedEdge = edges.find(
          (edge) =>
            edge.source === currentNode && edge.label === `= ${condition.value}`
        );
        break;
      } else if (
        condition.operator === "contains" &&
        userInput.toLowerCase().includes(condition.value.toLowerCase())
      ) {
        matchedCondition = condition;
        matchedEdge = edges.find(
          (edge) =>
            edge.source === currentNode &&
            typeof edge.label === "string" &&
            edge.label.includes(condition.value)
        );
        break;
      }
    }

    // Se não encontrou correspondência, usar fallback
    if (!matchedEdge) {
      matchedEdge = edges.find(
        (edge) =>
          edge.source === currentNode &&
          (edge.label === "outros" ||
            edge.label === "fallback" ||
            edge.label === "padrão")
      );
    }

    if (matchedEdge) {
      const nextNode = nodes.find((n) => n.id === matchedEdge.target);
      if (nextNode) {
        setTimeout(() => {
          setCurrentNode(nextNode.id);
          if (nextNode.data.message) {
            addBotMessage(nextNode.data.message, nextNode.id);
          }
          processNode(nextNode.id);
        }, 800);
      }
    } else {
      // Nenhuma condição atendida e sem fallback
      setTimeout(() => {
        addBotMessage(
          "❌ Opção não reconhecida. Tente novamente com uma das opções disponíveis.",
          currentNode
        );
      }, 800);
    }

    setUserInput("");
  };

  if (!currentFlow) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            Selecione um flow para ver o preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">📱 Simulador de Conversa</h3>
            <p className="text-blue-100 text-xs">{currentFlow.name}</p>
          </div>
          <div className="flex gap-2">
            {!isSimulating ? (
              <button
                onClick={startSimulation}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ▶️ Iniciar Teste
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ⏹️ Parar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && !isSimulating && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-gray-300 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586z"
                />
              </svg>
            </div>
            <p className="text-sm">
              Clique em "Iniciar Teste" para simular a conversa
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 border"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.text}</div>
              <div
                className={`text-xs mt-1 ${
                  message.sender === "user" ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isSimulating && (
        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleUserMessage()}
              placeholder="Digite sua resposta..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!currentNode}
            />
            <button
              onClick={handleUserMessage}
              disabled={!userInput.trim() || !currentNode}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg text-sm transition-colors"
            >
              Enviar
            </button>
          </div>

          {currentNode && (
            <div className="mt-2 text-xs text-gray-500">
              Nó atual: {currentNode} |{" "}
              {nodes.find((n) => n.id === currentNode)?.data.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
