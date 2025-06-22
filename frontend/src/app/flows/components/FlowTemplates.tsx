"use client";

import { useFlowsStore } from "@/store/flows";
import { useState } from "react";

interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: any[];
  edges: any[];
  preview: string;
}

const templates: FlowTemplate[] = [
  {
    id: "welcome-menu",
    name: "Menu de Boas-vindas",
    description: "Flow básico com saudação e menu de opções",
    category: "Básico",
    preview: "👋 Olá! → Menu (1. Vendas, 2. Suporte, 3. Informações)",
    nodes: [
      {
        id: "start-1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          type: "start",
          label: "Início",
          message:
            "👋 Olá! Bem-vindo ao nosso atendimento.\n\nComo posso te ajudar hoje?",
        },
      },
      {
        id: "menu-1",
        type: "custom",
        position: { x: 400, y: 100 },
        data: {
          type: "condition",
          label: "Menu Principal",
          condition: "user_input",
          conditions: [
            {
              value: "1",
              operator: "equals",
              target: "user_input",
              label: "1️⃣ Falar com vendas",
            },
            {
              value: "2",
              operator: "equals",
              target: "user_input",
              label: "2️⃣ Suporte técnico",
            },
            {
              value: "3",
              operator: "equals",
              target: "user_input",
              label: "3️⃣ Informações gerais",
            },
          ],
        },
      },
      {
        id: "vendas-1",
        type: "custom",
        position: { x: 700, y: 50 },
        data: {
          type: "message",
          label: "Vendas",
          message:
            "🛒 Perfeito! Vou te conectar com nossa equipe de vendas.\n\nEm alguns instantes um consultor irá te atender.",
        },
      },
      {
        id: "suporte-1",
        type: "custom",
        position: { x: 700, y: 150 },
        data: {
          type: "message",
          label: "Suporte",
          message:
            "🔧 Entendi! Para melhor te ajudar, você poderia descrever o problema que está enfrentando?",
        },
      },
      {
        id: "info-1",
        type: "custom",
        position: { x: 700, y: 250 },
        data: {
          type: "message",
          label: "Informações",
          message:
            "ℹ️ Aqui estão nossas principais informações:\n\n📍 Endereço: Rua Example, 123\n⏰ Horário: Seg-Sex 9h às 18h\n📞 Telefone: (11) 1234-5678",
        },
      },
      {
        id: "fallback-1",
        type: "custom",
        position: { x: 700, y: 350 },
        data: {
          type: "message",
          label: "Opção Inválida",
          message:
            "❌ Opção inválida! Por favor, escolha uma das opções disponíveis:\n\n1️⃣ Vendas\n2️⃣ Suporte\n3️⃣ Informações",
        },
      },
    ],
    edges: [
      {
        id: "edge-start-menu",
        source: "start-1",
        target: "menu-1",
        type: "smoothstep",
      },
      {
        id: "edge-menu-vendas",
        source: "menu-1",
        target: "vendas-1",
        type: "smoothstep",
        label: "= 1",
      },
      {
        id: "edge-menu-suporte",
        source: "menu-1",
        target: "suporte-1",
        type: "smoothstep",
        label: "= 2",
      },
      {
        id: "edge-menu-info",
        source: "menu-1",
        target: "info-1",
        type: "smoothstep",
        label: "= 3",
      },
      {
        id: "edge-menu-fallback",
        source: "menu-1",
        target: "fallback-1",
        type: "smoothstep",
        label: "outros",
      },
    ],
  },
  {
    id: "lead-capture",
    name: "Captura de Lead",
    description: "Coleta informações do usuário (nome, email, telefone)",
    category: "Marketing",
    preview: "📝 Cadastro → Nome → Email → Telefone → Confirmação",
    nodes: [
      {
        id: "start-2",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          type: "start",
          label: "Início",
          message:
            "🎯 Que bom que você se interessou!\n\nVamos fazer um cadastro rápido para te enviarmos mais informações.",
        },
      },
      {
        id: "ask-name",
        type: "custom",
        position: { x: 400, y: 100 },
        data: {
          type: "message",
          label: "Pedir Nome",
          message: "👤 Qual é o seu nome?",
        },
      },
      {
        id: "ask-email",
        type: "custom",
        position: { x: 700, y: 100 },
        data: {
          type: "message",
          label: "Pedir Email",
          message: "📧 Agora me informe seu melhor email:",
        },
      },
      {
        id: "ask-phone",
        type: "custom",
        position: { x: 1000, y: 100 },
        data: {
          type: "message",
          label: "Pedir Telefone",
          message: "📱 Por último, seu telefone com DDD:",
        },
      },
      {
        id: "confirm",
        type: "custom",
        position: { x: 1300, y: 100 },
        data: {
          type: "message",
          label: "Confirmação",
          message:
            "✅ Perfeito! Cadastro realizado com sucesso.\n\nEm breve você receberá nossas novidades por email e WhatsApp.",
        },
      },
    ],
    edges: [
      {
        id: "edge-start-name",
        source: "start-2",
        target: "ask-name",
        type: "smoothstep",
      },
      {
        id: "edge-name-email",
        source: "ask-name",
        target: "ask-email",
        type: "smoothstep",
      },
      {
        id: "edge-email-phone",
        source: "ask-email",
        target: "ask-phone",
        type: "smoothstep",
      },
      {
        id: "edge-phone-confirm",
        source: "ask-phone",
        target: "confirm",
        type: "smoothstep",
      },
    ],
  },
  {
    id: "faq",
    name: "FAQ Inteligente",
    description: "Perguntas frequentes com detecção de palavras-chave",
    category: "Suporte",
    preview: "❓ FAQ → Detecta palavras → Respostas automáticas",
    nodes: [
      {
        id: "start-3",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          type: "start",
          label: "Início",
          message:
            "❓ Olá! Sou seu assistente virtual.\n\nDescreva sua dúvida que vou tentar te ajudar:",
        },
      },
      {
        id: "keywords",
        type: "custom",
        position: { x: 400, y: 100 },
        data: {
          type: "condition",
          label: "Detectar FAQ",
          condition: "contains_keyword",
          conditions: [
            {
              value: "preço|valor|custo|quanto",
              operator: "regex",
              target: "user_input",
              label: "💰 Perguntas sobre preços",
            },
            {
              value: "entrega|prazo|envio",
              operator: "regex",
              target: "user_input",
              label: "🚚 Perguntas sobre entrega",
            },
            {
              value: "cancelar|devolver|estorno",
              operator: "regex",
              target: "user_input",
              label: "↩️ Cancelamentos",
            },
          ],
        },
      },
    ],
    edges: [
      {
        id: "edge-start-keywords",
        source: "start-3",
        target: "keywords",
        type: "smoothstep",
      },
    ],
  },
];

export default function FlowTemplates() {
  const { createFlowFromTemplate, setCurrentFlow } = useFlowsStore();
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categories = [
    "Todos",
    ...Array.from(new Set(templates.map((t) => t.category))),
  ];
  const filteredTemplates =
    selectedCategory === "Todos"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleUseTemplate = (template: FlowTemplate) => {
    const newFlow = {
      id: `flow-${Date.now()}`,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description,
      nodes: template.nodes,
      edges: template.edges,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggers: [],
    };

    createFlowFromTemplate(newFlow);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          🎨 Templates de Flow
        </h2>
        <p className="text-gray-600 text-sm">
          Comece rapidamente com templates prontos inspirados nos melhores
          sistemas de chatbot
        </p>
      </div>

      {/* Filtros de Categoria */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {template.category}
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">
              {template.name}
            </h3>

            <p className="text-gray-600 text-sm mb-3">{template.description}</p>

            <div className="bg-gray-50 rounded p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Preview do Flow:</p>
              <p className="text-xs text-gray-700 font-mono">
                {template.preview}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {template.nodes.length} nós • {template.edges.length} conexões
              </div>

              <button
                onClick={() => handleUseTemplate(template)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Usar Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dica */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              💡 Dica Profissional
            </h4>
            <p className="text-xs text-blue-700">
              Estes templates são baseados nos padrões mais eficazes de sistemas
              como ManyChat, Dialogflow e ChatBot. Você pode personalizar
              qualquer template após aplicá-lo ao seu flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
