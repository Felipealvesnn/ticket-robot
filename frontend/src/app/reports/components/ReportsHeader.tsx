// Arquivo simplificado para evitar erros de build

interface ReportsHeaderProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  currentReportType?: string;
  isLoading?: boolean;
  currentData?: any;
}

export function ReportsHeader({
  onExportPDF,
  onExportExcel,
  currentReportType = "tickets",
  isLoading = false,
  currentData,
}: ReportsHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Relatórios
        </h1>
        <div className="flex gap-2">
          <button
            onClick={onExportPDF}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Exportar PDF
          </button>
          <button
            onClick={onExportExcel}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Exportar Excel
          </button>
        </div>
      </div>
    </div>
  );
}
