"use client";

import { useSocket } from "@/hooks/useSocket";

interface ChatInfoProps {
  messagesCount: number;
  isUploading: boolean;
}

export default function ChatInfo({
  messagesCount,
  isUploading,
}: ChatInfoProps) {
  const { isConnected } = useSocket();

  return (
    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
      <div className="flex items-center space-x-4">
        <span>
          {isConnected ? (
            <span className="text-green-600 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Conectado em tempo real
            </span>
          ) : (
            <span className="text-red-600 flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              Desconectado
            </span>
          )}
        </span>
        {messagesCount > 0 && (
          <span className="text-gray-400">
            {messagesCount} mensagem{messagesCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <span className="text-right">
        {isUploading
          ? "Enviando arquivo..."
          : "Enter para enviar • Arraste arquivos • Esc para limpar"}
      </span>
    </div>
  );
}
