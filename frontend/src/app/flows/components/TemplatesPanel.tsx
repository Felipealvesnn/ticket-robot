"use client";

import { useFlowsStore } from "@/store/flows";
import { Button, Card } from "flowbite-react";

// Templates de flows prontos
const FLOW_TEMPLATES = [
  {
    id: "welcome",
    name: "Boas-vindas Simples",
    description: "Flow básico de boas-vindas com menu principal",
    template: {
      id: "template-welcome",
      name: "Boas-vindas Simples",
      description: "Flow básico de boas-vindas",
      nodes: [
        {
          id: "start-1",
          type: "custom",
          position: { x: 100, y: 100 },
          data: {
            type: "start",
            label: "Início",
          },
        },
        {
          id: "message-1",
          type: "custom",
          position: { x: 300, y: 200 },
          data: {
            type: "message",
            label: "Boas-vindas",
            message:
              "Olá! 👋 Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?",
          },
        },
        {
          id: "condition-1",
          type: "custom",
          position: { x: 300, y: 350 },
          data: {
            type: "condition",
            label: "Menu Principal",
            conditions: [
              { value: "atendente", label: "📞 Falar com atendente" },
              { value: "precos", label: "💰 Consultar preços" },
              { value: "produtos", label: "📋 Ver produtos" },
            ],
          },
        },
      ],
      edges: [
        {
          id: "e1-2",
          source: "start-1",
          target: "message-1",
          type: "smoothstep",
        },
        {
          id: "e2-3",
          source: "message-1",
          target: "condition-1",
          type: "smoothstep",
        },
      ],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggers: ["oi", "olá", "hello"],
    },
  },
  {
    id: "support",
    name: "Suporte Técnico",
    description: "Flow para atendimento técnico com triagem",
    template: {
      id: "template-support",
      name: "Suporte Técnico",
      description: "Flow para atendimento técnico",
      nodes: [
        {
          id: "start-2",
          type: "custom",
          position: { x: 100, y: 100 },
          data: {
            type: "start",
            label: "Início",
          },
        },
        {
          id: "message-2",
          type: "custom",
          position: { x: 300, y: 200 },
          data: {
            type: "message",
            label: "Suporte Técnico",
            message:
              "Olá! Você está no suporte técnico. Vamos resolver seu problema juntos! 🔧",
          },
        },
        {
          id: "condition-2",
          type: "custom",
          position: { x: 300, y: 350 },
          data: {
            type: "condition",
            label: "Tipo do Problema",
            conditions: [
              { value: "conexao", label: "🌐 Problema de conexão" },
              { value: "sistema", label: "💻 Erro no sistema" },
              { value: "login", label: "🔑 Problema de login" },
              { value: "outro", label: "❓ Outro problema" },
            ],
          },
        },
      ],
      edges: [
        {
          id: "e1-2",
          source: "start-2",
          target: "message-2",
          type: "smoothstep",
        },
        {
          id: "e2-3",
          source: "message-2",
          target: "condition-2",
          type: "smoothstep",
        },
      ],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggers: ["problema", "erro", "suporte"],
    },
  },
];

export default function TemplatesPanel() {
  const { createFlowFromTemplate } = useFlowsStore();

  const applyTemplate = (template: any) => {
    createFlowFromTemplate(template.template);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Templates Prontos</h3>
      <div className="space-y-3">
        {FLOW_TEMPLATES.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-1">
                {template.name}
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                {template.description}
              </p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {template.template.nodes.length} elementos
                </div>
                <Button
                  size="xs"
                  onClick={() => applyTemplate(template)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Usar Template
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500">💡</div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Dica</h4>
            <p className="text-xs text-blue-700">
              Os templates são uma ótima forma de começar rapidamente. Você pode
              modificá-los depois de aplicar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
