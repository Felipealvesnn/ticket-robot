"use client";

import {
  Calculator,
  Clock,
  Database,
  FileText,
  GitBranch,
  Image,
  Link,
  Mail,
  MessageSquare,
  Phone,
  Play,
  Settings,
  StopCircle,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import { FC } from "react";

interface ElementsPaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const nodeCategories = [
  {
    title: "Mensagens",
    items: [
      {
        type: "message",
        label: "Mensagem de Texto",
        icon: MessageSquare,
        color: "blue",
      },
      { type: "image", label: "Imagem", icon: Image, color: "green" },
      { type: "file", label: "Arquivo", icon: FileText, color: "purple" },
    ],
  },
  {
    title: "Fluxo",
    items: [
      {
        type: "condition",
        label: "Condição",
        icon: GitBranch,
        color: "orange",
      },
      { type: "delay", label: "Aguardar", icon: Clock, color: "yellow" },
      { type: "start", label: "Início", icon: Play, color: "green" },
      { type: "end", label: "Fim", icon: StopCircle, color: "red" },
    ],
  },
  {
    title: "Ações",
    items: [
      { type: "webhook", label: "Webhook", icon: Link, color: "indigo" },
      {
        type: "database",
        label: "Banco de Dados",
        icon: Database,
        color: "gray",
      },
      {
        type: "calculation",
        label: "Calcular",
        icon: Calculator,
        color: "pink",
      },
      { type: "tag", label: "Adicionar Tag", icon: Tag, color: "teal" },
    ],
  },
  {
    title: "Integração",
    items: [
      { type: "email", label: "Enviar Email", icon: Mail, color: "red" },
      { type: "phone", label: "Fazer Ligação", icon: Phone, color: "green" },
      { type: "automation", label: "Automação", icon: Zap, color: "yellow" },
      { type: "segment", label: "Segmentar", icon: Users, color: "blue" },
    ],
  },
];

const getColorClasses = (color: string) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 border-green-200 hover:bg-green-100",
    purple:
      "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100",
    orange:
      "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
    yellow:
      "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100",
    red: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100",
    gray: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
    pink: "bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100",
    teal: "bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100",
  };
  return colors[color as keyof typeof colors] || colors.gray;
};

export const ElementsPalette: FC<ElementsPaletteProps> = ({ onDragStart }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Elementos</h3>
        <p className="text-sm text-gray-500 mt-1">Arraste para o canvas</p>
      </div>

      {/* Elements */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {nodeCategories.map((category) => (
          <div key={category.title}>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {category.title}
            </h4>
            <div className="space-y-2">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(event) => onDragStart(event, item.type)}
                    className={`
                      flex items-center gap-3 p-3 border rounded-lg cursor-grab active:cursor-grabbing
                      transition-all duration-200 hover:shadow-sm
                      ${getColorClasses(item.color)}
                    `}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Settings size={16} />
          Configurações
        </button>
      </div>
    </div>
  );
};
