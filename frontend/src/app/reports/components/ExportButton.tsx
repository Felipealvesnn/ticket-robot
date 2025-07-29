import {
  DocumentArrowDownIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface ExportButtonProps {
  type: "pdf" | "excel";
  onExport: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ExportButton({
  type,
  onExport,
  isLoading = false,
  disabled = false,
}: ExportButtonProps) {
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    // Simular progresso durante a exportação
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await onExport();
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    } catch (error) {
      setProgress(0);
    } finally {
      clearInterval(interval);
    }
  };

  const isPdf = type === "pdf";
  const baseClasses =
    "px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 relative overflow-hidden";
  const colorClasses = isPdf
    ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500";

  const disabledClasses =
    disabled || isLoading
      ? "opacity-50 cursor-not-allowed"
      : "hover:scale-105 focus:scale-105 focus:ring-2";

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${colorClasses} ${disabledClasses}`}
      title={`Exportar relatório em ${type.toUpperCase()}`}
    >
      {/* Barra de progresso */}
      {isLoading && (
        <div
          className="absolute left-0 top-0 h-full bg-white bg-opacity-20 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Ícone */}
      {isPdf ? (
        <DocumentArrowDownIcon
          className={`w-5 h-5 ${isLoading ? "animate-bounce" : ""}`}
        />
      ) : (
        <TableCellsIcon
          className={`w-5 h-5 ${isLoading ? "animate-pulse" : ""}`}
        />
      )}

      {/* Texto */}
      <span className="font-medium">
        {isLoading ? `Gerando ${type.toUpperCase()}...` : type.toUpperCase()}
      </span>

      {/* Spinner para loading */}
      {isLoading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
    </button>
  );
}
