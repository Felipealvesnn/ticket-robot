"use client";

import {
  DocumentIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useRef, useState } from "react";

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

  // Enviar com Enter
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSendMessage();
      }
      if (e.key === "Escape") {
        if (showEmojiPicker || showMediaPicker || previewFile) {
          setShowEmojiPicker(false);
          setShowMediaPicker(false);
          setPreviewFile(null);
        } else {
          setMessageText("");
        }
      }
    },
    [
      onSendMessage,
      showEmojiPicker,
      showMediaPicker,
      previewFile,
      setMessageText,
    ]
  );

  // Adicionar emoji
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      setMessageText(messageText + emoji);
      setShowEmojiPicker(false);

      // Focar no textarea após adicionar emoji
      if (textareaRef.current) {
        textareaRef.current.focus();
        const length = textareaRef.current.value.length;
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
    <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
      {/* Input de arquivo escondido */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,application/*"
      />

      {/* Modal de preview de arquivo */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Enviar arquivo</h3>

            <div className="mb-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {previewFile.type.startsWith("image/") ? (
                  <PhotoIcon className="w-8 h-8 text-blue-500" />
                ) : previewFile.type.startsWith("video/") ? (
                  <VideoCameraIcon className="w-8 h-8 text-purple-500" />
                ) : (
                  <DocumentIcon className="w-8 h-8 text-gray-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {previewFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            {previewFile.type.startsWith("image/") && (
              <div className="mb-4">
                <img
                  src={URL.createObjectURL(previewFile)}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setPreviewFile(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFileSend}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isUploading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de progresso de upload */}
      {isUploading && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Enviando arquivo...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-end space-x-3">
        {/* Botão de mídia */}
        <div className="relative" ref={mediaPickerRef}>
          <button
            type="button"
            onClick={() => setShowMediaPicker(!showMediaPicker)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Anexar mídia"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>

          {showMediaPicker && (
            <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => openFileSelector("image/*")}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Enviar imagem"
                >
                  <PhotoIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openFileSelector("video/*")}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Enviar vídeo"
                >
                  <VideoCameraIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openFileSelector("*")}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Enviar documento"
                >
                  <DocumentIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Campo de texto */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua mensagem... (Enter para enviar, Esc para limpar)"
            rows={1}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            disabled={disabled}
          />
        </div>

        {/* Botão de emoji */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Adicionar emoji"
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-50">
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                <div className="grid grid-cols-6 gap-1">
                  {[
                    "😀",
                    "😂",
                    "😍",
                    "🤔",
                    "😎",
                    "😭",
                    "👍",
                    "👎",
                    "❤️",
                    "🔥",
                    "💯",
                    "🎉",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-2 hover:bg-gray-100 rounded text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botão de envio */}
        <button
          onClick={onSendMessage}
          disabled={!messageText.trim() || disabled}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Enviar mensagem (Enter)"
        >
          {disabled ? (
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
