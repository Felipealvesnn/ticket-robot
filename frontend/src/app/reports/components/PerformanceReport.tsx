import type { PerformanceReport } from "@/services/api";

interface PerformanceReportProps {
  data: PerformanceReport;
}

export function PerformanceReportComponent({ data }: PerformanceReportProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Relatório de Performance
            </h3>
          </div>

          {/* Métricas de Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(data as any).totalTickets || 0}
              </div>
              <div className="text-sm text-blue-600">Total de Tickets</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(data as any).resolvedTickets || 0}
              </div>
              <div className="text-sm text-green-600">Tickets Resolvidos</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(data as any).resolutionRate || 0}%
              </div>
              <div className="text-sm text-purple-600">Taxa de Resolução</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {data.averageResponseTime || "0m"}
              </div>
              <div className="text-sm text-yellow-600">Tempo Médio</div>
            </div>
          </div>

          {/* Performance dos Agentes */}
          {(data as any).agentStats && (data as any).agentStats.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Performance dos Agentes
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tickets Atendidos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tempo Médio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tickets Ativos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(data as any).agentStats.map(
                      (agent: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {agent.agentName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {agent.handledTickets}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {agent.averageResponseTime}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {agent.activeTickets}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Estatísticas Diárias */}
          {(data as any).dailyStats && (data as any).dailyStats.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Estatísticas Diárias
              </h4>
              <div className="space-y-3">
                {(data as any).dailyStats.map((day: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="flex space-x-6 text-sm text-gray-600">
                      <span>{day.messagesHandled} mensagens</span>
                      <span>{day.ticketsResolved} tickets resolvidos</span>
                      <span>Tempo médio: {day.averageResponseTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caso não tenha dados */}
          {(!(data as any).agentStats ||
            (data as any).agentStats.length === 0) &&
            (!(data as any).dailyStats ||
              (data as any).dailyStats.length === 0) && (
              <div className="text-center text-gray-500 py-8">
                Nenhum dado de performance disponível no período selecionado
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
