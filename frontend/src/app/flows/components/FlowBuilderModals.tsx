"use client";

import { Bot, Send, User, X } from "lucide-react";
import { FC, useState } from "react";

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestModal: FC<TestModalProps> = ({ isOpen, onClose }) => {
  const [testMessage, setTestMessage] = useState("");
  const [conversation, setConversation] = useState<
    Array<{
      id: string;
      type: "user" | "bot";
      message: string;
      timestamp: Date;
    }>
  >([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateFlow = async () => {
    if (!testMessage.trim()) return;

    setIsSimulating(true);

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      type: "user" as const,
      message: testMessage,
      timestamp: new Date(),
    };

    setConversation((prev) => [...prev, userMsg]);
    setTestMessage("");

    // Simulate bot response after delay
    setTimeout(() => {
      const botMsg = {
        id: (Date.now() + 1).toString(),
        type: "bot" as const,
        message: "Esta é uma simulação de resposta do bot baseada no seu flow.",
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, botMsg]);
      setIsSimulating(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Testar Flow</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Chat Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {conversation.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Digite uma mensagem para testar o flow</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        msg.type === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-white border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {msg.type === "user" ? (
                          <User size={14} />
                        ) : (
                          <Bot size={14} />
                        )}
                        <span className="text-xs opacity-75">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                {isSimulating && (
                  <div className="flex justify-start">
                    <div className="bg-white border p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Bot size={14} />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && simulateFlow()}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSimulating}
              />
              <button
                onClick={simulateFlow}
                disabled={isSimulating || !testMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FlowBuilderModals: FC = () => {
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Listen for global events to open modals
  // You can extend this to handle other modals

  return (
    <>
      <TestModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
      />

      {/* Add other modals here */}
      {/* Analytics Modal */}
      {/* Settings Modal */}
      {/* Templates Modal */}
    </>
  );
};
