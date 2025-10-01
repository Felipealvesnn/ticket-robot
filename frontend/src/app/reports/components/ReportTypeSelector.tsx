interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: any;
}

interface ReportTypeSelectorProps {
  reportTypes: ReportType[];
  selectedReport: string;
  onReportSelect: (reportId: string) => void;
}

export function ReportTypeSelector({
  reportTypes,
  selectedReport,
  onReportSelect,
}: ReportTypeSelectorProps) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Relatórios Disponíveis
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <div
              key={type.id}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all duration-200 ${
                selectedReport === type.id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:shadow-lg"
              }`}
              onClick={() => onReportSelect(type.id)}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    selectedReport === type.id ? "bg-blue-600" : "bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      selectedReport === type.id
                        ? "text-white"
                        : "text-gray-600"
                    }`}
                  />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {type.name}
                </h4>
                <p className="text-sm text-gray-500">{type.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
