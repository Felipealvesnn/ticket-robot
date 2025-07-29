import type { OverviewStats } from "@/services/api";
import { ChartBarIcon, ChartPieIcon } from "@heroicons/react/24/outline";

interface OverviewReportProps {
  data: OverviewStats;
}

export function OverviewReport({ data }: OverviewReportProps) {
  return (
    <>
      {/* Gráfico de Mensagens por Dia */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Mensagens por Dia
            </h3>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.messagesByDay.length > 0 ? (
              data.messagesByDay.map((day: any, index: number) => (
                <div key={index} className="flex items-center">
                  <div className="w-12 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString("pt-BR", {
                      weekday: "short",
                    })}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (day.messages /
                              Math.max(
                                ...data.messagesByDay.map(
                                  (d: any) => d.messages
                                )
                              )) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm font-medium text-gray-900 text-right">
                    {day.messages}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Contatos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Contatos
            </h3>
            <ChartPieIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.topContacts.length > 0 ? (
              data.topContacts.map((contact: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {contact.name}
                      </p>
                      <p className="text-sm text-gray-500">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {contact.messageCount || contact.messages || 0}
                    </p>
                    <p className="text-sm text-gray-500">mensagens</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
