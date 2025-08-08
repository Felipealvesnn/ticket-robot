"use client";

import { TicketMessage } from "@/store/tickets";
import {
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import DateSeparator from "./DateSeparator";

interface ChatMessagesProps {
  messages: TicketMessage[];
  isLoading: boolean;
  isTyping: boolean;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  gestureBinds?: any; // 🔥 NOVO: Suporte para gestos avançados
  contactName?: string; // Nome do contato para o avatar
}

export default function ChatMessages({
  messages,
  isLoading,
  isTyping,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  gestureBinds,
  contactName,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll automático para a última mensagem
  const scrollToBottom = useCallback(
    (behavior: "auto" | "smooth" = "smooth") => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
      }
    },
    []
  );

  // Scroll automático quando mensagens mudam
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    }
  }, [messages.length, scrollToBottom]);

  return (
    <div
      ref={messagesContainerRef}
      className={`h-full overflow-y-auto p-4 bg-gray-50 relative ${
        dragOver ? "bg-blue-50 border-2 border-dashed border-blue-300" : ""
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      {...(gestureBinds || {})} // 🔥 NOVO: Aplicar gestos avançados
    >
      <div className="space-y-3 max-w-4xl mx-auto">
        {/* Melhor espaçamento e contentor máximo */}
        {/* Overlay de drag & drop */}
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 z-10">
            <div className="text-center">
              <PaperClipIcon className="w-12 h-12 mx-auto text-blue-500 mb-2" />
              <p className="text-lg font-medium text-blue-700">
                Solte o arquivo aqui
              </p>
              <p className="text-sm text-blue-600">
                Máximo 10MB - Imagens, vídeos e documentos
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">
              Carregando mensagens...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">Nenhuma mensagem ainda</p>
              <p className="text-xs text-gray-400">
                Inicie a conversa enviando uma mensagem
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDate =
                index === 0 ||
                new Date(message.createdAt).toDateString() !==
                  new Date(messages[index - 1].createdAt).toDateString();

              return (
                <div key={message.id || index}>
                  {/* Separador de data */}
                  {showDate && (
                    <DateSeparator date={new Date(message.createdAt)} />
                  )}

                  {/* Mensagem */}
                  <ChatMessage message={message} contactName={contactName} />
                </div>
              );
            })}

            {/* Indicador de digitação */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-4 py-2 rounded-lg">
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
            )}
          </>
        )}

        {/* Referência para scroll automático */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
