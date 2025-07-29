import {
  DocumentArrowDownIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

interface ReportsHeaderProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export function ReportsHeader({
  onExportPDF,
  onExportExcel,
}: ReportsHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600">
              Análise completa de mensagens e performance
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onExportPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              PDF
            </button>
            <button
              onClick={onExportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <TableCellsIcon className="w-5 h-5 mr-2" />
              Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
