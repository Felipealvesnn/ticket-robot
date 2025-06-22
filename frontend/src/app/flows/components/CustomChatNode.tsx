"use client";

import { Badge } from "flowbite-react";

interface CustomChatNodeProps {
  data: any;
  selected: boolean;
}

export default function CustomChatNode({
  data,
  selected,
}: CustomChatNodeProps) {
  const getNodeStyle = () => {
    const baseStyle =
      "rounded-xl border-2 shadow-lg transition-all duration-200 min-w-[200px] max-w-[280px] bg-white";

    switch (data.type) {
      case "start":
        return `${baseStyle} border-green-400 ${
          selected ? "ring-4 ring-green-300" : ""
        } bg-gradient-to-br from-green-50 to-green-100`;
      case "message":
        return `${baseStyle} border-blue-400 ${
          selected ? "ring-4 ring-blue-300" : ""
        } bg-gradient-to-br from-blue-50 to-blue-100`;
      case "condition":
        return `${baseStyle} border-yellow-400 ${
          selected ? "ring-4 ring-yellow-300" : ""
        } bg-gradient-to-br from-yellow-50 to-yellow-100`;
      case "action":
        return `${baseStyle} border-purple-400 ${
          selected ? "ring-4 ring-purple-300" : ""
        } bg-gradient-to-br from-purple-50 to-purple-100`;
      case "end":
        return `${baseStyle} border-red-400 ${
          selected ? "ring-4 ring-red-300" : ""
        } bg-gradient-to-br from-red-50 to-red-100`;
      default:
        return `${baseStyle} border-gray-300`;
    }
  };

  const getIcon = () => {
    switch (data.type) {
      case "start":
        return "🚀";
      case "message":
        return "💬";
      case "condition":
        return "❓";
      case "action":
        return "⚡";
      case "end":
        return "🏁";
      default:
        return "📦";
    }
  };

  const getTitle = () => {
    return data.label || data.title || "Novo Nó";
  };

  const getContent = () => {
    if (data.message) return data.message;
    if (data.condition) return `Condição: ${data.condition}`;
    if (data.action) return `Ação: ${data.action}`;
    return "";
  };

  return (
    <div className={getNodeStyle()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getIcon()}</span>
          <span className="font-semibold text-gray-800 text-sm">
            {getTitle()}
          </span>
        </div>
        {data.conditions && data.conditions.length > 0 && (
          <Badge color="purple" size="xs">
            {data.conditions.length} opções
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {getContent() && (
          <p className="text-sm text-gray-700 line-clamp-3">{getContent()}</p>
        )}

        {/* Preview das condições para nós de menu */}
        {data.conditions && data.conditions.length > 0 && (
          <div className="space-y-1 mt-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Opções:</p>
            {data.conditions.slice(0, 3).map((condition: any, idx: number) => (
              <div
                key={idx}
                className="text-xs bg-gray-50 rounded px-2 py-1 border"
              >
                {condition.label || condition.value}
              </div>
            ))}
            {data.conditions.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{data.conditions.length - 3} mais...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Handles para conexões */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
    </div>
  );
}
