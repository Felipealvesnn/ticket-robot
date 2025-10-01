"use client";

import { TicketMessage } from "@/store/tickets";
import {
  CheckIcon,
  DocumentIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import ContactAvatar from "./ContactAvatar";
import ImageViewer from "./ImageViewer";

interface ChatMessageProps {
  message: TicketMessage;
  contactName?: string;
}

export default function ChatMessage({
  message,
  contactName,
}: ChatMessageProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Função para obter URL da mídia
  const getMediaUrl = () => {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    console.log("🔍 getMediaUrl - Processing message:", {
      id: message.id,
      mediaUrl: message.mediaUrl,
      hasMetadata: !!message.metadata,
      metadataType: typeof message.metadata,
    });

    // 1. Priorizar dados base64 do metadata (para novas mensagens)
    if (message.metadata?.media?.base64Data) {
      console.log("✅ Found base64Data in metadata");
      // Se já é uma data URL, retornar direto
      if (message.metadata.media.base64Data.startsWith("data:")) {
        return message.metadata.media.base64Data;
      }
      // Se é só base64, criar data URL
      const mimeType =
        message.metadata.media.mimeType ||
        message.mediaMimeType ||
        "image/jpeg";
      return `data:${mimeType};base64,${message.metadata.media.base64Data}`;
    }

    // 2. Usar mediaUrl se disponível (para mensagens do banco)
    if (message.mediaUrl) {
      console.log("✅ Found mediaUrl field:", message.mediaUrl);
      // Se já é uma data URL ou URL completa, retornar direto
      if (
        message.mediaUrl.startsWith("data:") ||
        message.mediaUrl.startsWith("http")
      ) {
        return message.mediaUrl;
      }
      // Se é um ID ou path de mídia, usar rota de visualização do backend
      return `${API_BASE_URL}/media/${message.mediaUrl}/view`;
    }

    // 3. Fallback para API usando ID da mensagem
    const fallbackUrl = `${API_BASE_URL}/media/${message.id}/view`;
    console.log("🔄 Using fallback API URL:", fallbackUrl);
    return fallbackUrl;
  };

  // Função para obter nome do arquivo
  const getFileName = () => {
    // 1. Metadata do arquivo (novos uploads)
    if (message.metadata?.media?.fileName) {
      return message.metadata.media.fileName;
    }

    // 2. Campo mediaFileName direto
    if (message.mediaFileName) {
      return message.mediaFileName;
    }

    // 3. Extrair do content se tiver formato específico
    if (message.content.includes("Arquivo enviado:")) {
      return message.content.replace("Arquivo enviado: ", "");
    }

    // 4. Gerar nome baseado no tipo de mensagem
    const extension = getFileExtension();
    const messageType = message.messageType.toLowerCase();
    return `${messageType}_${new Date(
      message.createdAt
    ).getTime()}.${extension}`;
  };

  // Função para obter extensão do arquivo
  const getFileExtension = () => {
    // 1. Tentar extrair do mime type
    const mimeType = message.metadata?.media?.mimeType || message.mediaMimeType;
    if (mimeType) {
      const mimeMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/ogg": "ogg",
        "application/pdf": "pdf",
        "application/msword": "doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          "docx",
      };
      if (mimeMap[mimeType]) {
        return mimeMap[mimeType];
      }
    }

    // 2. Fallback baseado no tipo de mensagem
    switch (message.messageType) {
      case "IMAGE":
        return "jpg";
      case "VIDEO":
        return "mp4";
      case "AUDIO":
        return "mp3";
      default:
        return "file";
    }
  };

  // Função para obter tamanho formatado
  const getFileSize = () => {
    // 1. Metadata do arquivo (novos uploads)
    if (message.metadata?.media?.size) {
      const size = message.metadata.media.size;
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    // 2. Campo mediaFileSize direto
    if (message.mediaFileSize) {
      const size = message.mediaFileSize;
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    // 3. Tentar calcular do base64 se disponível
    if (
      message.metadata?.media?.base64Data &&
      !message.metadata.media.base64Data.startsWith("data:")
    ) {
      // Base64 simples - calcular tamanho aproximado
      const base64Size = message.metadata.media.base64Data.length;
      const bytes = (base64Size * 3) / 4; // Aproximação do tamanho real
      if (bytes < 1024) return `${Math.round(bytes)} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return null;
  };

  const renderMediaContent = () => {
    const messageType = message.messageType.toLocaleUpperCase();

    switch (messageType) {
      case "IMAGE".toLocaleUpperCase():
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
                onClick={() => setShowImageViewer(true)}
                loading="lazy"
                onError={(e) => {
                  const imgElement = e.target as HTMLImageElement;
                  const mediaUrl = getMediaUrl();
                  console.error("❌ Erro ao carregar imagem:", {
                    messageId: message.id,
                    originalSrc: mediaUrl,
                    mediaUrl: message.mediaUrl,
                    fileName: getFileName(),
                    error: e,
                  });

                  // Tentar carregar placeholder ou mostrar erro visual
                  imgElement.style.display = "none";
                  const errorDiv = document.createElement("div");
                  errorDiv.className =
                    "flex items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[100px]";
                  errorDiv.innerHTML = `
                    <div class="text-center text-gray-500">
                      <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <p class="text-sm">Erro ao carregar imagem</p>
                      <p class="text-xs text-gray-400">${getFileName()}</p>
                    </div>
                  `;
                  imgElement.parentNode?.appendChild(errorDiv);
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
    <>
      {/* Image Viewer Modal */}
      {message.messageType.toLocaleUpperCase() === "IMAGE" && (
        <ImageViewer
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          imageUrl={getMediaUrl()}
          fileName={getFileName()}
          fileSize={getFileSize() || undefined}
        />
      )}

      <div
        className={`flex ${
          message.isMe ? "justify-end" : "justify-start"
        } items-end gap-2`}
      >
        <ContactAvatar name={contactName} isMe={message.isMe} />

        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
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
    </>
  );
}
