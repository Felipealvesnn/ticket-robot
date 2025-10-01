import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import React, { createContext, useCallback, useContext, useState } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
  showExportSuccess: (format: string, fileName: string) => void;
  showExportError: (format: string, error: string) => void;
  showExportProgress: (format: string) => string;
  updateExportProgress: (id: string, progress: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastItemProps {
  toast: Toast & { progress?: number };
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationCircleIcon,
    info: InformationCircleIcon,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const iconColors = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-yellow-500",
    info: "text-blue-500",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`border rounded-lg p-4 shadow-lg transition-all duration-300 ${
        colors[toast.type]
      }`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-6 h-6 flex-shrink-0 ${iconColors[toast.type]}`} />

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm mt-1 opacity-90">{toast.message}</p>
          )}

          {/* Barra de progresso para exportações */}
          {typeof toast.progress === "number" && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progresso</span>
                <span>{Math.round(toast.progress)}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                <div
                  className="bg-current h-2 rounded-full transition-all duration-300"
                  style={{ width: `${toast.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Ação personalizada */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<(Toast & { progress?: number })[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remover após duração especificada
    if (toast.duration !== 0) {
      setTimeout(() => {
        hideToast(id);
      }, toast.duration || 5000);
    }

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showExportSuccess = useCallback(
    (format: string, fileName: string) => {
      showToast({
        type: "success",
        title: `${format.toUpperCase()} gerado com sucesso!`,
        message: `O arquivo "${fileName}" foi baixado`,
        action: {
          label: "Ver na pasta Downloads",
          onClick: () => {
            // Abrir pasta de downloads (específico do browser)
            if (navigator.userAgent.includes("Chrome")) {
              window.open("chrome://downloads/");
            }
          },
        },
      });
    },
    [showToast]
  );

  const showExportError = useCallback(
    (format: string, error: string) => {
      showToast({
        type: "error",
        title: `Erro ao gerar ${format.toUpperCase()}`,
        message: error,
        duration: 8000,
        action: {
          label: "Tentar novamente",
          onClick: () => {
            // Callback para tentar novamente seria passado pelo componente pai
          },
        },
      });
    },
    [showToast]
  );

  const showExportProgress = useCallback(
    (format: string) => {
      return showToast({
        type: "info",
        title: `Gerando ${format.toUpperCase()}...`,
        message: "Isso pode levar alguns segundos",
        duration: 0, // Não auto-remover
      });
    },
    [showToast]
  );

  const updateExportProgress = useCallback((id: string, progress: number) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, progress } : toast))
    );
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    showExportSuccess,
    showExportError,
    showExportProgress,
    updateExportProgress,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Container de Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={hideToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
