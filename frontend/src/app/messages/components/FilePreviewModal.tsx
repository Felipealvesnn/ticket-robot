"use client";

import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useEffect } from "react";

interface FilePreviewModalProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isUploading?: boolean;
}

export default function FilePreviewModal({
  file,
  isOpen,
  onClose,
  onConfirm,
  isUploading = false,
}: FilePreviewModalProps) {
  // Fechar modal com Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium mb-4">Enviar arquivo</h3>

        <div className="mb-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            {file.type.startsWith("image/") ? (
              <PhotoIcon className="w-8 h-8 text-blue-500" />
            ) : file.type.startsWith("video/") ? (
              <VideoCameraIcon className="w-8 h-8 text-purple-500" />
            ) : (
              <DocumentIcon className="w-8 h-8 text-gray-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>

        {file.type.startsWith("image/") && (
          <div className="mb-4">
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isUploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isUploading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
