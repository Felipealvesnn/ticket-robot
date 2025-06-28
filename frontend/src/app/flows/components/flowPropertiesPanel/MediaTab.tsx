"use client";

import { Upload, X } from "lucide-react";
import { FC, useState } from "react";

interface MediaTabProps {
  node: any;
  nodeType: string;
  onUpdateProperty: (property: string, value: any) => void;
}

export const MediaTab: FC<MediaTabProps> = ({
  node,
  nodeType,
  onUpdateProperty,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Handlers para drag e drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];

      if (file.size > 10 * 1024 * 1024) {
        alert("Arquivo muito grande. Máximo permitido: 10MB");
        return;
      }

      await uploadMedia(file);
    }
  };

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Função para validar tipo de arquivo
  const validateFileType = (file: File, nodeType: string): boolean => {
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const documentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];

    if (nodeType === "image") {
      return imageTypes.includes(file.type);
    } else if (nodeType === "file") {
      return documentTypes.includes(file.type);
    }

    return false;
  };

  // Função para fazer upload de mídia
  const uploadMedia = async (file: File) => {
    if (!validateFileType(file, nodeType)) {
      alert(`Tipo de arquivo não permitido para nós do tipo "${nodeType}"`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Erro no upload do arquivo");
      }

      const result = await response.json();
      setUploadProgress(100);

      if (result.success && result.data) {
        onUpdateProperty("mediaId", result.data.mediaId);
        onUpdateProperty("fileName", result.data.originalName);
        onUpdateProperty("fileSize", result.data.size);
        onUpdateProperty("mimeType", result.data.mimeType);
        onUpdateProperty("mediaType", result.data.mediaType);
        onUpdateProperty("mediaUrl", result.data.url);

        setTimeout(() => setUploadProgress(0), 1000);
      } else {
        throw new Error(result.error || "Erro no upload");
      }
    } catch (error) {
      console.error("Erro no upload:", error);

      let errorMessage = "Erro ao fazer upload do arquivo";
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          errorMessage = "Sessão expirada. Faça login novamente.";
        } else if (error.message.includes("413")) {
          errorMessage = "Arquivo muito grande. Máximo permitido: 10MB";
        } else if (error.message.includes("415")) {
          errorMessage = "Tipo de arquivo não suportado";
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload de Arquivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nodeType === "image" ? "Imagem" : "Arquivo"}
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id={`media-upload-${node.id}`}
            accept={
              nodeType === "image"
                ? "image/*"
                : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            }
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  alert("Arquivo muito grande. Máximo permitido: 10MB");
                  return;
                }

                await uploadMedia(file);
                e.target.value = "";
              }
            }}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor={`media-upload-${node.id}`}
            className={`cursor-pointer inline-flex flex-col items-center ${
              uploading ? "opacity-50" : ""
            }`}
          >
            <Upload size={24} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              {uploading
                ? "Fazendo upload..."
                : isDragging
                ? `Solte ${
                    nodeType === "image" ? "a imagem" : "o arquivo"
                  } aqui`
                : `Clique para selecionar ou arraste ${
                    nodeType === "image" ? "uma imagem" : "um arquivo"
                  }`}
            </span>
            <span className="text-xs text-gray-400 mt-1">
              {nodeType === "image"
                ? "PNG, JPG, GIF até 10MB"
                : "PDF, DOC, XLS, PPT até 10MB"}
            </span>
          </label>

          {/* Barra de progresso do upload */}
          {uploading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">
                {uploadProgress}% concluído
              </span>
            </div>
          )}
        </div>

        {/* Mostrar arquivo selecionado */}
        {node.data?.fileName && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {nodeType === "image" ? "🖼️" : "📎"}
                </span>
                <div>
                  <span className="text-sm font-medium text-gray-700 block">
                    {node.data.fileName}
                  </span>
                  {node.data?.fileSize && (
                    <span className="text-xs text-gray-500">
                      {formatFileSize(node.data.fileSize)}
                      {node.data?.mimeType && ` • ${node.data.mimeType}`}
                    </span>
                  )}
                  {node.data?.mediaId && (
                    <span className="text-xs text-green-600 block">
                      ✅ Upload concluído • ID: {node.data.mediaId.slice(0, 8)}
                      ...
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  onUpdateProperty("fileName", "");
                  onUpdateProperty("fileSize", 0);
                  onUpdateProperty("mediaId", "");
                  onUpdateProperty("mimeType", "");
                  onUpdateProperty("mediaType", "");
                  onUpdateProperty("mediaUrl", "");
                }}
                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                title="Remover arquivo"
              >
                <X size={16} />
              </button>
            </div>

            {/* Preview para imagens */}
            {nodeType === "image" && node.data?.mediaUrl && (
              <div className="mt-3">
                <img
                  src={node.data.mediaUrl}
                  alt={node.data.fileName}
                  className="max-w-full h-32 object-cover rounded border"
                  onError={(e) => {
                    console.log("Erro ao carregar preview da imagem");
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legenda/Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {nodeType === "image" ? "Legenda (opcional)" : "Descrição (opcional)"}
        </label>
        <textarea
          value={node.data?.caption || node.data?.description || ""}
          onChange={(e) =>
            onUpdateProperty(
              nodeType === "image" ? "caption" : "description",
              e.target.value
            )
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
          placeholder={
            nodeType === "image"
              ? "Texto que acompanha a imagem..."
              : "Descrição do arquivo..."
          }
        />
      </div>

      {/* Aguardar resposta do usuário */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comportamento
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={node.data?.awaitInput !== false}
            onChange={(e) => onUpdateProperty("awaitInput", e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">
            Aguardar resposta do usuário antes de continuar
          </span>
        </label>
      </div>
    </div>
  );
};
