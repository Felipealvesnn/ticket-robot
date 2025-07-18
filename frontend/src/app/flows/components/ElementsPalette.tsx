"use client";

import {
  Calculator,
  Clock,
  Database,
  FileText,
  FormInput,
  GitBranch,
  Headphones,
  Home,
  Image,
  Link,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  Play,
  Settings,
  StopCircle,
  Tag,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { FC } from "react";

interface ElementsPaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const nodeCategories = [
  {
    title: "� Captura de Dados",
    items: [
      {
        type: "input",
        label: "Campo de Entrada",
        icon: FormInput,
        color: "teal",
        description: "Capturar dados do usuário (nome, CPF, email, etc.)",
        gradient: true,
        special: true,
      },
    ],
  },
  {
    title: "�💬 Mensagens",
    items: [
      {
        type: "message",
        label: "Mensagem de Texto",
        icon: MessageSquare,
        color: "blue",
        description: "Enviar mensagem de texto para o usuário",
        gradient: true,
      },
      {
        type: "image",
        label: "Imagem",
        icon: Image,
        color: "green",
        description: "Enviar imagem ou GIF",
        gradient: true,
      },
      {
        type: "file",
        label: "Arquivo",
        icon: FileText,
        color: "purple",
        description: "Enviar arquivo ou documento",
        gradient: true,
      },
    ],
  },
  {
    title: "🔀 Controle de Fluxo",
    items: [
      {
        type: "condition",
        label: "Condição",
        icon: GitBranch,
        color: "orange",
        description: "Criar ramificação baseada em condições",
        special: true,
        gradient: true,
      },
      {
        type: "delay",
        label: "Aguardar",
        icon: Clock,
        color: "yellow",
        description: "Pausar execução por tempo determinado",
        gradient: true,
      },
      {
        type: "start",
        label: "Início",
        icon: Play,
        color: "green",
        description: "Ponto de entrada do fluxo",
        special: true,
      },
      {
        type: "end",
        label: "Fim",
        icon: StopCircle,
        color: "red",
        description: "Finalizar conversa",
        special: true,
      },
    ],
  },
  {
    title: "📋 Menus Interativos",
    items: [
      {
        type: "menu",
        label: "Menu",
        icon: Menu,
        color: "gray",
        description: "Menu com opções para o usuário escolher",
        special: true,
        gradient: true,
      },
    ],
  },
  {
    title: "🎧 Atendimento Humano",
    items: [
      {
        type: "transfer",
        label: "Falar com Atendente",
        icon: Headphones,
        color: "blue",
        description: "Transferir conversa para atendente humano",
        premium: true,
        gradient: true,
      },
      {
        type: "ticket",
        label: "Criar Ticket",
        icon: UserCheck,
        color: "indigo",
        description: "Gerar ticket de suporte",
        premium: true,
        gradient: true,
      },
    ],
  },
  {
    title: "⚡ Ações Avançadas",
    items: [
      {
        type: "webhook",
        label: "Webhook",
        icon: Link,
        color: "indigo",
        description: "Integrar com API externa",
        technical: true,
      },
      {
        type: "database",
        label: "Banco de Dados",
        icon: Database,
        color: "gray",
        description: "Consultar ou salvar dados",
        technical: true,
      },
      {
        type: "calculation",
        label: "Calcular",
        icon: Calculator,
        color: "pink",
        description: "Realizar cálculos matemáticos",
        technical: true,
      },
      {
        type: "tag",
        label: "Adicionar Tag",
        icon: Tag,
        color: "teal",
        description: "Marcar usuário com etiqueta",
      },
    ],
  },
  {
    title: "🌐 Integrações",
    items: [
      {
        type: "email",
        label: "Enviar Email",
        icon: Mail,
        color: "red",
        description: "Disparar email automático",
        integration: true,
      },
      {
        type: "phone",
        label: "Fazer Ligação",
        icon: Phone,
        color: "green",
        description: "Iniciar chamada telefônica",
        integration: true,
      },
      {
        type: "automation",
        label: "Automação",
        icon: Zap,
        color: "yellow",
        description: "Executar automação customizada",
        integration: true,
      },
      {
        type: "segment",
        label: "Segmentar",
        icon: Users,
        color: "blue",
        description: "Adicionar usuário a segmento",
        integration: true,
      },
    ],
  },
];

const getColorClasses = (
  color: string,
  special?: boolean,
  gradient?: boolean,
  premium?: boolean,
  technical?: boolean,
  integration?: boolean
) => {
  const baseColors = {
    blue: gradient
      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 hover:from-blue-100 hover:to-blue-200"
      : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
    green: gradient
      ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-300 hover:from-green-100 hover:to-green-200"
      : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100",
    purple: gradient
      ? "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-300 hover:from-purple-100 hover:to-purple-200"
      : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100",
    orange: gradient
      ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-300 hover:from-orange-100 hover:to-orange-200"
      : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
    yellow: gradient
      ? "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-300 hover:from-yellow-100 hover:to-yellow-200"
      : "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100",
    red: gradient
      ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-300 hover:from-red-100 hover:to-red-200"
      : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
    indigo: gradient
      ? "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-300 hover:from-indigo-100 hover:to-indigo-200"
      : "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100",
    gray: gradient
      ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-300 hover:from-gray-100 hover:to-gray-200"
      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
    pink: "bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100",
    teal: "bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100",
  };

  let classes = baseColors[color as keyof typeof baseColors] || baseColors.gray;

  // Adicionar classes especiais
  if (special) {
    classes += " border-2 border-dashed";
  }
  if (premium) {
    classes += " ring-2 ring-opacity-50 ring-blue-300";
  }
  if (technical) {
    classes += " border-dotted";
  }
  if (integration) {
    classes += " shadow-sm";
  }

  return classes;
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
            </h4>{" "}
            <div className="space-y-3">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(event) => onDragStart(event, item.type)}
                    className={`
                      relative flex flex-col gap-2 p-3 border rounded-xl cursor-grab active:cursor-grabbing
                      transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                      ${getColorClasses(
                        item.color,
                        (item as any).special,
                        (item as any).gradient,
                        (item as any).premium,
                        (item as any).technical,
                        (item as any).integration
                      )}
                    `}
                    title={(item as any).description}
                  >
                    {/* Header com ícone e badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="text-sm font-semibold">
                          {item.label}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex gap-1">
                        {(item as any).premium && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                            PRO
                          </span>
                        )}
                        {(item as any).special && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-400 text-yellow-900 rounded-full">
                            ⭐
                          </span>
                        )}
                        {(item as any).technical && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-400 text-white rounded-full">
                            DEV
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Descrição */}
                    {(item as any).description && (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {(item as any).description}
                      </p>
                    )}

                    {/* Indicador especial para "Falar com Atendente" */}
                    {item.type === "transfer" && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">
                          Atendimento ao vivo
                        </span>
                      </div>
                    )}

                    {/* Indicador especial para "Condição" */}
                    {item.type === "condition" && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-xs text-orange-600 font-medium">
                          Múltiplas saídas
                        </span>
                      </div>
                    )}

                    {/* Indicador especial para "Input" */}
                    {item.type === "input" && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        <span className="text-xs text-teal-600 font-medium">
                          Salva em variável
                        </span>
                      </div>
                    )}

                    {/* Indicador especial para "Menu" */}
                    {item.type === "menu" && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-600 font-medium">
                          Múltiplas opções
                        </span>
                      </div>
                    )}

                 
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
