import {
  CheckIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: "pdf" | "excel", options: ExportOptions) => void;
  reportType: string;
  isLoading?: boolean;
}

interface ExportOptions {
  format: "pdf" | "excel";
  includeCharts: boolean;
  includeFilters: boolean;
  pageOrientation: "portrait" | "landscape";
  maxRecords: number;
  fileName?: string;
}

const EXPORT_PRESETS = {
  quick: {
    name: "Exportação Rápida",
    description: "Configurações padrão para download imediato",
    options: {
      includeCharts: true,
      includeFilters: true,
      pageOrientation: "portrait" as const,
      maxRecords: 1000,
    },
  },
  detailed: {
    name: "Relatório Detalhado",
    description: "Inclui todos os dados e gráficos disponíveis",
    options: {
      includeCharts: true,
      includeFilters: true,
      pageOrientation: "landscape" as const,
      maxRecords: 5000,
    },
  },
  compact: {
    name: "Relatório Compacto",
    description: "Apenas dados essenciais, sem gráficos",
    options: {
      includeCharts: false,
      includeFilters: false,
      pageOrientation: "portrait" as const,
      maxRecords: 500,
    },
  },
};

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  reportType,
  isLoading = false,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "excel">("pdf");
  const [selectedPreset, setSelectedPreset] =
    useState<keyof typeof EXPORT_PRESETS>("quick");
  const [customOptions, setCustomOptions] = useState<Partial<ExportOptions>>(
    {}
  );
  const [fileName, setFileName] = useState("");

  if (!isOpen) return null;

  const currentPreset = EXPORT_PRESETS[selectedPreset];
  const finalOptions: ExportOptions = {
    format: selectedFormat,
    ...currentPreset.options,
    ...customOptions,
    fileName:
      fileName ||
      `relatorio-${reportType}-${new Date().toISOString().split("T")[0]}`,
  };

  const handleExport = () => {
    onExport(selectedFormat, finalOptions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Opções de Exportação
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Seleção de Formato */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Formato</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedFormat("pdf")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedFormat === "pdf"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <DocumentArrowDownIcon className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">PDF</div>
                <div className="text-xs text-gray-600">
                  Ideal para impressão
                </div>
              </button>

              <button
                onClick={() => setSelectedFormat("excel")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedFormat === "excel"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <TableCellsIcon className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">Excel</div>
                <div className="text-xs text-gray-600">Ideal para análise</div>
              </button>
            </div>
          </div>

          {/* Presets */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Configurações Predefinidas
            </h3>
            <div className="space-y-2">
              {Object.entries(EXPORT_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() =>
                    setSelectedPreset(key as keyof typeof EXPORT_PRESETS)
                  }
                  className={`w-full p-3 text-left rounded-lg border transition-all ${
                    selectedPreset === key
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {preset.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {preset.description}
                      </div>
                    </div>
                    {selectedPreset === key && (
                      <CheckIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Nome do Arquivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Arquivo (opcional)
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={`relatorio-${reportType}-${
                new Date().toISOString().split("T")[0]
              }`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Resumo das Configurações */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Resumo</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>
                Formato:{" "}
                <span className="font-medium">
                  {selectedFormat.toUpperCase()}
                </span>
              </div>
              <div>
                Orientação:{" "}
                <span className="font-medium">
                  {finalOptions.pageOrientation === "portrait"
                    ? "Retrato"
                    : "Paisagem"}
                </span>
              </div>
              <div>
                Máximo de registros:{" "}
                <span className="font-medium">
                  {finalOptions.maxRecords.toLocaleString()}
                </span>
              </div>
              <div>
                Incluir gráficos:{" "}
                <span className="font-medium">
                  {finalOptions.includeCharts ? "Sim" : "Não"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className={`px-6 py-2 text-white rounded-lg transition-all ${
              selectedFormat === "pdf"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gerando...</span>
              </div>
            ) : (
              `Exportar ${selectedFormat.toUpperCase()}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
