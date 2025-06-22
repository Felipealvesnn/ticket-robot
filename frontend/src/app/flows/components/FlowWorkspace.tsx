"use client";

import { useFlowsStore } from "@/store/flows";
import { useState } from "react";
import FlowEditor from "./FlowEditor";
import FlowPreview from "./FlowPreview";
import FlowTemplates from "./FlowTemplates";

type TabType = "editor" | "templates" | "preview";

interface FlowWorkspaceProps {
  onCreateFlow?: () => void;
}

export default function FlowWorkspace({ onCreateFlow }: FlowWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const { currentFlow } = useFlowsStore();

  const tabs = [
    {
      id: "editor" as TabType,
      name: "🎨 Editor Visual",
      description: "Criar e editar flows",
      icon: "🎨",
    },
    {
      id: "templates" as TabType,
      name: "📋 Templates",
      description: "Modelos prontos",
      icon: "📋",
    },
    {
      id: "preview" as TabType,
      name: "📱 Teste Interativo",
      description: "Simular conversa",
      icon: "📱",
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative px-4 py-2 rounded-t-lg font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {tab.description}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Current Flow Info */}
      {currentFlow && activeTab !== "templates" && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {currentFlow.name}
              </h2>
              <p className="text-sm text-gray-500">{currentFlow.description}</p>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>📊 {currentFlow.nodes?.length || 0} nós</span>
              <span>🔗 {currentFlow.edges?.length || 0} conexões</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentFlow.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {currentFlow.isActive ? "🟢 Ativo" : "⚪ Inativo"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "editor" && (
          <div className="h-full">
            {currentFlow ? (
              <FlowEditor onBack={() => {}} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="text-gray-300 mb-4">
                    <svg
                      className="w-20 h-20 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum Flow Selecionado
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Selecione um flow existente ou crie um novo para começar a
                    editar
                  </p>{" "}
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("templates")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      📋 Ver Templates
                    </button>
                    <button
                      onClick={onCreateFlow}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 shadow-md flex items-center justify-center space-x-2"
                    >
                      <span>➕</span>
                      <span>Criar Flow do Zero</span>
                    </button>
                    <div className="text-center text-xs text-gray-500 mt-4">
                      💡 Dica: Use templates para começar mais rápido
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "templates" && (
          <div className="h-full overflow-y-auto">
            <FlowTemplates />
          </div>
        )}

        {activeTab === "preview" && (
          <div className="h-full">
            <FlowPreview />
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {activeTab === "editor" && currentFlow && (
              <>
                <button className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1">
                  <span>💾</span>
                  <span>Salvar</span>
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1">
                  <span>↩️</span>
                  <span>Desfazer</span>
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1">
                  <span>↪️</span>
                  <span>Refazer</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {currentFlow && activeTab !== "preview" && (
              <button
                onClick={() => setActiveTab("preview")}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <span>▶️</span>
                <span>Testar Flow</span>
              </button>
            )}

            <div className="text-xs text-gray-500">
              {activeTab === "editor" &&
                "Use arrastar e soltar para conectar nós"}
              {activeTab === "templates" &&
                "Clique em um template para aplicar"}
              {activeTab === "preview" &&
                "Simule uma conversa real com seu chatbot"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
