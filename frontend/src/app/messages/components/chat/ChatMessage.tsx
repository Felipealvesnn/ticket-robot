"use client";

import { TicketMessage } from "@/store/tickets";
import {
  CheckIcon,
  DocumentIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

interface ChatMessageProps {
  message: TicketMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  // Função para obter URL da mídia
  const getMediaUrl = () => {
    // Priorizar dados base64 do metadata
    if (message.metadata?.media?.base64Data) {
      return message.metadata.media.base64Data;
    }

    // Fallback para API antiga
    return `/api/media/${message.id}`;
  };

  // Função para obter nome do arquivo
  const getFileName = () => {
    if (message.metadata?.media?.fileName) {
      return message.metadata.media.fileName;
    }

    if (message.content.includes("Arquivo enviado:")) {
      return message.content.replace("Arquivo enviado: ", "");
    }

    return "Arquivo";
  };

  // Função para obter tamanho formatado
  const getFileSize = () => {
    if (message.metadata?.media?.size) {
      const size = message.metadata.media.size;
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return null;
  };

  const renderMediaContent = () => {
    const messageType = message.messageType;

    switch (messageType) {
      case "IMAGE":
        return (
          <div className="space-y-2">
            {message.content && (
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
            )}
            <div className="relative">
              <img
                src={getMediaUrl()}
                alt={getFileName()}
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(getMediaUrl(), "_blank")}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-image.png";
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                <PhotoIcon className="w-4 h-4 text-white" />
              </div>
              {getFileSize() && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 rounded px-2 py-1 text-xs text-white">
                  {getFileSize()}
                </div>
              )}
            </div>
          </div>
        );

      case "VIDEO":
        return (
          <div className="space-y-2">
            {message.content && (
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
            )}
            <div className="relative">
              <video
                src={getMediaUrl()}
                controls
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: "200px" }}
                preload="metadata"
                onError={(e) => {
                  console.error("Erro ao carregar vídeo:", e);
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                <VideoCameraIcon className="w-4 h-4 text-white" />
              </div>
              {getFileSize() && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 rounded px-2 py-1 text-xs text-white">
                  {getFileSize()}
                </div>
              )}
            </div>
          </div>
        );

      case "DOCUMENT":
        return (
          <div className="space-y-2">
            {message.content && (
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
            )}
            <div
              className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => {
                const mediaUrl = getMediaUrl();
                if (mediaUrl.startsWith("data:")) {
                  // Para base64, criar um download direto
                  const link = document.createElement("a");
                  link.href = mediaUrl;
                  link.download = getFileName();
                  link.click();
                } else {
                  // Para URLs da API
                  window.open(`${mediaUrl}/download`, "_blank");
                }
              }}
            >
              <DocumentIcon className="w-8 h-8 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getFileName()}
                </p>
                <p className="text-xs text-gray-500">
                  {getFileSize() ? `${getFileSize()} • ` : ""}Clique para baixar
                </p>
              </div>
            </div>
          </div>
        );

      case "AUDIO":
        return (
          <div className="space-y-2">
            {message.content && (
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
            )}
            <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
              <SpeakerWaveIcon className="w-8 h-8 text-gray-600" />
              <div className="flex-1 min-w-0">
                <audio
                  src={getMediaUrl()}
                  controls
                  className="w-full"
                  preload="metadata"
                  onError={(e) => {
                    console.error("Erro ao carregar áudio:", e);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {getFileSize() ? `${getFileSize()} • ` : ""}Mensagem de áudio
                </p>
              </div>
            </div>
          </div>
        );

      default:
        // Mensagem de texto
        return (
          <div className="text-sm">
            {message.content.includes("**") ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: message.content
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n/g, "<br>"),
                }}
              />
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.isMe
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-900 border border-gray-200"
        }`}
      >
        {renderMediaContent()}

        {/* Info da mensagem */}
        <div className="flex items-center justify-between mt-1">
          <span
            className={`text-xs ${
              message.isMe ? "text-blue-100" : "text-gray-400"
            }`}
          >
            {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {message.isMe && (
            <div className="ml-2">
              {message.status === "SENT" && (
                <CheckIcon className="w-3 h-3 text-blue-200" />
              )}
              {message.status === "DELIVERED" && (
                <div className="flex">
                  <CheckIcon className="w-3 h-3 text-blue-200" />
                  <CheckIcon className="w-3 h-3 text-blue-200 -ml-1" />
                </div>
              )}
              {message.status === "READ" && (
                <div className="flex">
                  <CheckIcon className="w-3 h-3 text-green-300" />
                  <CheckIcon className="w-3 h-3 text-green-300 -ml-1" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
