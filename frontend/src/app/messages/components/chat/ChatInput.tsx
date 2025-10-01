"use client";

import FilePreviewModal from "@/app/messages/components/FilePreviewModal";
import {
  DocumentIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import EmojiPicker from "emoji-picker-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface ChatInputProps {
  messageText: string;
  setMessageText: (text: string) => void;
  onSendMessage: () => void;
  onFileUpload: (
    file: File,
    messageType: "IMAGE" | "VIDEO" | "DOCUMENT"
  ) => void;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function ChatInput({
  messageText,
  setMessageText,
  onSendMessage,
  onFileUpload,
  disabled = false,
  isUploading = false,
  uploadProgress = 0,
}: ChatInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const mediaPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fechar pickers quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setShowEmojiPicker(false);
      }
      if (mediaPickerRef.current && !mediaPickerRef.current.contains(target)) {
        setShowMediaPicker(false);
      }
    };

    if (showEmojiPicker || showMediaPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showEmojiPicker, showMediaPicker]);

  // Auto-resize do textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessageText(e.target.value);

      // Auto-resize
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    },
    [setMessageText]
  );

  // Atalhos de teclado usando useHotkeys
  useHotkeys(
    "enter",
    (e) => {
      if (!e.shiftKey && textareaRef.current === document.activeElement) {
        e.preventDefault();
        onSendMessage();
      }
    },
    { enableOnFormTags: ["textarea"] }
  );

  useHotkeys(
    "escape",
    () => {
      if (showEmojiPicker || showMediaPicker) {
        setShowEmojiPicker(false);
        setShowMediaPicker(false);
      } else {
        setMessageText("");
        textareaRef.current?.focus();
      }
    },
    { enableOnFormTags: ["textarea"] }
  );

  useHotkeys(
    "ctrl+enter",
    () => {
      onSendMessage();
    },
    { enableOnFormTags: ["textarea"] }
  );

  useHotkeys(
    "ctrl+e",
    (e) => {
      e.preventDefault();
      setShowEmojiPicker(!showEmojiPicker);
      textareaRef.current?.focus();
    },
    { enableOnFormTags: ["textarea"] }
  );

  useHotkeys(
    "ctrl+shift+m",
    (e) => {
      e.preventDefault();
      setShowMediaPicker(!showMediaPicker);
    },
    { enableOnFormTags: ["textarea"] }
  );

  // Enviar com Enter (mantido para Shift+Enter quebrar linha)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    // Apenas permitir Shift+Enter para quebra de linha
    if (e.key === "Enter" && e.shiftKey) {
      // Permite a quebra de linha natural
      return;
    }
  }, []);

  // Adicionar emoji
  const handleEmojiSelect = useCallback(
    (emojiData: any) => {
      const emoji = emojiData.emoji;
      setMessageText(messageText + emoji);
      setShowEmojiPicker(false);

      // Focar no textarea após adicionar emoji
      if (textareaRef.current) {
        textareaRef.current.focus();
        const length = textareaRef.current.value.length + emoji.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    },
    [setMessageText, messageText]
  );

  // Seletor de arquivo
  const openFileSelector = useCallback((accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  }, []);

  // Selecionar arquivo
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Verificar tamanho do arquivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("Arquivo muito grande! Máximo 10MB.");
        return;
      }

      setPreviewFile(file);
    },
    []
  );

  // Confirmar envio de arquivo
  const confirmFileSend = useCallback(() => {
    if (!previewFile) return;

    // Determinar tipo da mensagem
    let messageType: "IMAGE" | "VIDEO" | "DOCUMENT" = "DOCUMENT";
    if (previewFile.type.startsWith("image/")) {
      messageType = "IMAGE";
    } else if (previewFile.type.startsWith("video/")) {
      messageType = "VIDEO";
    }

    onFileUpload(previewFile, messageType);
    setPreviewFile(null);
  }, [previewFile, onFileUpload]);

  return (
    <div className="border-t border-gray-200 bg-white flex-shrink-0">
      {/* Input de arquivo escondido */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,application/*"
      />

      {/* Modal de preview de arquivo */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onConfirm={confirmFileSend}
        isUploading={isUploading}
      />

      {/* Barra de progresso de upload */}
      {isUploading && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>📎 Enviando arquivo...</span>
            <span className="font-medium">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Container principal do input */}
      <div className="p-3">
        <div className="flex items-end space-x-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
          {/* Botão de mídia */}
          <div className="relative" ref={mediaPickerRef}>
            <button
              type="button"
              onClick={() => setShowMediaPicker(!showMediaPicker)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showMediaPicker
                  ? "text-blue-600 bg-blue-100"
                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
              title="Anexar arquivo • Ctrl+Shift+M"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>

            {showMediaPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-1">
                <div className="flex space-x-1">
                  <button
                    onClick={() => openFileSelector("image/*")}
                    className="flex flex-col items-center p-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 min-w-[60px]"
                    title="Enviar imagem"
                  >
                    <PhotoIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Foto</span>
                  </button>
                  <button
                    onClick={() => openFileSelector("video/*")}
                    className="flex flex-col items-center p-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 min-w-[60px]"
                    title="Enviar vídeo"
                  >
                    <VideoCameraIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Vídeo</span>
                  </button>
                  <button
                    onClick={() => openFileSelector("*")}
                    className="flex flex-col items-center p-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 min-w-[60px]"
                    title="Enviar documento"
                  >
                    <DocumentIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Arquivo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Campo de texto */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="w-full p-0 border-0 bg-transparent focus:outline-none resize-none text-sm placeholder-gray-500 leading-5"
              style={{ minHeight: "20px", maxHeight: "100px" }}
              disabled={disabled}
            />
          </div>

          {/* Botão de emoji */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showEmojiPicker
                  ? "text-blue-600 bg-blue-100"
                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
              title="Adicionar emoji • Ctrl+E"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </div>
            )}
          </div>

          {/* Botão de envio */}
          <button
            onClick={onSendMessage}
            disabled={!messageText.trim() || disabled}
            className={`p-2 rounded-lg transition-all duration-200 ${
              messageText.trim() && !disabled
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title="Enviar mensagem • Enter"
          >
            {disabled ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Dicas de atalhos - aparece quando o campo está focado */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          <span className="inline-flex items-center space-x-4">
            <span>
              💡{" "}
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                Enter
              </kbd>{" "}
              enviar
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                Shift+Enter
              </kbd>{" "}
              nova linha
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                Ctrl+E
              </kbd>{" "}
              emoji
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>{" "}
              limpar
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
