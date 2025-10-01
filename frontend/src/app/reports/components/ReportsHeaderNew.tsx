import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { ExportModal } from "./ExportModal";
import { ReportPreview } from "./ReportPreviewSimple";
import { useToast } from "./ToastProvider";

interface ReportsHeaderProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  currentReportType?: string;
  isLoading?: boolean;
  currentData?: any;
}

interface ExportOptions {
  format: "pdf" | "excel";
  includeCharts: boolean;
  includeFilters: boolean;
  pageOrientation: "portrait" | "landscape";
  maxRecords: number;
  fileName?: string;
}

export function ReportsHeader({
  onExportPDF,
  onExportExcel,
  currentReportType = "overview",
  isLoading = false,
  currentData,
}: ReportsHeaderProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showQuickExport, setShowQuickExport] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<"pdf" | "excel">("pdf");
  const {
    showExportSuccess,
    showExportError,
    showExportProgress,
    updateExportProgress,
  } = useToast();

  // Função para mostrar preview
  const handleShowPreview = (format: "pdf" | "excel") => {
    setPreviewFormat(format);
    setShowPreview(true);
  };

  // Função para download direto do preview (removida por não ser usada)
  /*
  const handleDirectDownload = async (format: 'pdf' | 'excel') => {
    setShowPreview(false);
    const progressId = showExportProgress(format);
    
    try {
      for (let i = 0; i <= 100; i += 20) {
        updateExportProgress(progressId, i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (format === 'pdf') {
        await onExportPDF();
      } else {
        await onExportExcel();
      }

      showExportSuccess(format, `relatorio-${currentReportType}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
    } catch (error) {
      showExportError(format, 'Erro interno do servidor. Tente novamente.');
    }
  };
  */

  // Exportação rápida (sem preview)
  const handleQuickExport = async (format: "pdf" | "excel") => {
    // const progressId = showExportProgress(format);

    try {
      /*
      for (let i = 0; i <= 100; i += 20) {
        updateExportProgress(progressId, i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      */

      if (format === "pdf") {
        await onExportPDF();
      } else {
        await onExportExcel();
      }

      // showExportSuccess(format, `relatorio-${currentReportType}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
    } catch (error) {
      // showExportError(format, 'Erro interno do servidor. Tente novamente.');
      console.error("Erro na exportação rápida:", error);
    }
  };

  const handleAdvancedExport = async (
    format: "pdf" | "excel",
    options: ExportOptions
  ) => {
    setShowExportModal(false);
    // const progressId = showExportProgress(format);

    try {
      if (format === "pdf") {
        await onExportPDF();
      } else {
        await onExportExcel();
      }

      // showExportSuccess(format, options.fileName || `relatorio-${currentReportType}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
    } catch (error) {
      // showExportError(format, 'Erro ao processar exportação personalizada.');
      console.error("Erro na exportação:", error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentReportType.charAt(0).toUpperCase() +
                    currentReportType.slice(1)}
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                Análise completa de mensagens e performance do sistema
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center text-sm text-gray-500 mr-4">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>Atualizado há 2 min</span>
              </div>

              {/* Botões principais - agora abrem preview */}
              <button
                onClick={() => handleShowPreview("pdf")}
                disabled={isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 hover:scale-105"
                title="Ver preview do PDF"
              >
                <EyeIcon className="w-5 h-5" />
                <span>Preview PDF</span>
              </button>

              <button
                onClick={() => handleShowPreview("excel")}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 hover:scale-105"
                title="Ver preview do Excel"
              >
                <EyeIcon className="w-5 h-5" />
                <span>Preview Excel</span>
              </button>

              {/* Menu dropdown para opções avançadas */}
              <div className="relative">
                <button
                  onClick={() => setShowQuickExport(!showQuickExport)}
                  className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  title="Mais opções"
                >
                  <ChevronDownIcon className="w-5 h-5" />
                </button>

                {showQuickExport && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Download Direto
                      </div>
                      <button
                        onClick={() => {
                          handleQuickExport("pdf");
                          setShowQuickExport(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 text-red-500" />
                        <div>
                          <div className="font-medium">PDF Direto</div>
                          <div className="text-xs text-gray-500">
                            Baixa sem preview
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          handleQuickExport("excel");
                          setShowQuickExport(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium">Excel Direto</div>
                          <div className="text-xs text-gray-500">
                            Baixa sem preview
                          </div>
                        </div>
                      </button>

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Configurações Avançadas
                        </div>
                        <button
                          onClick={() => {
                            setShowExportModal(true);
                            setShowQuickExport(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium">
                              Opções Personalizadas
                            </div>
                            <div className="text-xs text-gray-500">
                              Layouts, filtros, etc.
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleAdvancedExport}
        reportType={currentReportType}
        isLoading={isLoading}
      />

      <ReportPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        reportData={currentData}
        reportType={currentReportType}
        format={previewFormat}
      />
    </>
  );
}
