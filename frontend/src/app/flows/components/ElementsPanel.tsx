"use client";

import { useFlowsStore } from "@/store/flows";
import { Card, Tooltip } from "flowbite-react";

const FLOW_ELEMENTS = [
  {
    type: "start",
    icon: "🚀",
    name: "Início",
    desc: "Ponto de entrada do flow",
  },
  {
    type: "message",
    icon: "💬",
    name: "Mensagem",
    desc: "Enviar texto ou mídia",
  },
  {
    type: "condition",
    icon: "❓",
    name: "Menu/Condição",
    desc: "Criar opções para o usuário",
  },
  {
    type: "action",
    icon: "⚡",
    name: "Ação",
    desc: "Executar função ou integração",
  },
  {
    type: "end",
    icon: "🏁",
    name: "Fim",
    desc: "Finalizar conversa",
  },
];

export default function ElementsPanel() {
  const { addNode } = useFlowsStore();

  const createNewNode = (type: string) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };
    addNode(type as any, position);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Elementos do Flow</h3>
      <p className="text-xs text-gray-600 mb-4">
        Clique para adicionar ao canvas
      </p>
      <div className="space-y-2">
        {FLOW_ELEMENTS.map((element) => (
          <Tooltip key={element.type} content={element.desc}>
            <Card
              className="cursor-pointer hover:shadow-md hover:scale-105 transition-all"
              onClick={() => createNewNode(element.type)}
            >
              <div className="p-3 flex items-center space-x-3">
                <span className="text-xl">{element.icon}</span>
                <div>
                  <p className="font-medium text-sm">{element.name}</p>
                  <p className="text-xs text-gray-500">{element.desc}</p>
                </div>
              </div>
            </Card>
          </Tooltip>
        ))}
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start space-x-3">
          <div className="text-green-500">🎯</div>
          <div>
            <h4 className="font-medium text-green-800 mb-1">Como usar</h4>
            <div className="text-xs text-green-700 space-y-1">
              <p>1. Adicione elementos clicando neles</p>
              <p>2. Conecte os nós arrastando as bolinhas</p>
              <p>3. Clique em um nó para editá-lo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
