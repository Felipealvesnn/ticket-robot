import type { ReportFilters } from "@/services/api";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: any;
}

interface ReportsFiltersProps {
  reportTypes: ReportType[];
  selectedReport: string;
  currentFilters: ReportFilters;
  onReportChange: (reportId: string) => void;
  onDateRangeChange: (field: "startDate" | "endDate", value: string) => void;
}

export function ReportsFilters({
  reportTypes,
  selectedReport,
  currentFilters,
  onReportChange,
  onDateRangeChange,
}: ReportsFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <select
              value={selectedReport}
              onChange={(e) => onReportChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={currentFilters.startDate}
              onChange={(e) => onDateRangeChange("startDate", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={currentFilters.endDate}
              onChange={(e) => onDateRangeChange("endDate", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
