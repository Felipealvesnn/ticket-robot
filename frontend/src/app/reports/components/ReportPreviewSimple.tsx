import {
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface ReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: any;
  reportType: string;
  format: "pdf" | "excel";
  onDownload?: () => void;
}

export function ReportPreview({
  isOpen,
  onClose,
  reportData,
  reportType,
  format,
  onDownload,
}: ReportPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
  };

  const renderPreviewContent = () => {
    if (format === "pdf") {
      return (
        <div
          className="bg-white shadow-lg rounded-lg p-8 transform origin-top"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold text-blue-600">
              {reportType === "overview" && "Relatório - Visão Geral"}
              {reportType === "messages" && "Relatório de Mensagens"}
              {reportType === "contacts" && "Relatório de Contatos"}
              {reportType === "performance" && "Relatório de Performance"}
            </h1>
            <p className="text-gray-600 mt-2">
              Gerado em: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          {reportType === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Estatísticas Principais
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border p-3 rounded">
                    <div className="text-sm text-gray-600">
                      Total de Mensagens
                    </div>
                    <div className="text-xl font-bold">
                      {reportData?.totalMessages || 0}
                    </div>
                  </div>
                  <div className="border p-3 rounded">
                    <div className="text-sm text-gray-600">
                      Total de Contatos
                    </div>
                    <div className="text-xl font-bold">
                      {reportData?.totalContacts || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
            Relatório gerado automaticamente pelo Sistema de Tickets - Página{" "}
            {currentPage}
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h2 className="font-semibold">Preview do Excel - {reportType}</h2>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-300 p-2 text-left">
                      Dados
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Valores
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-2 text-sm">
                      Total de Mensagens
                    </td>
                    <td className="border border-gray-300 p-2 text-sm">
                      {reportData?.totalMessages || 0}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-gray-300 p-2 text-sm">
                      Total de Contatos
                    </td>
                    <td className="border border-gray-300 p-2 text-sm">
                      {reportData?.totalContacts || 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-600 text-center">
              Mostrando primeiros registros. O arquivo completo terá todos os
              dados.
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-100 rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <EyeIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Preview - {format.toUpperCase()}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {format === "pdf" && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <span className="text-sm font-medium">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            )}

            <button
              onClick={handleDownload}
              className={`px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center space-x-2 transition-all ${
                format === "pdf"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Baixar {format.toUpperCase()}</span>
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-center">{renderPreviewContent()}</div>
        </div>

        {format === "pdf" && (
          <div className="flex items-center justify-center p-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm">Página {currentPage} de 3</span>
              <button
                onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
                disabled={currentPage === 3}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
