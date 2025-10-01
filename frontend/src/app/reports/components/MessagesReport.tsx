import type { MessageReport } from "@/services/api";

interface MessagesReportProps {
  data: MessageReport;
  onLoadPage: (page: number) => void;
}

export function MessagesReport({ data, onLoadPage }: MessagesReportProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Relatório de Mensagens
            </h3>
            <span className="text-sm text-gray-500">
              Total: {data.total} mensagens
            </span>
          </div>

          {data.messages.length > 0 ? (
            <div>
              {/* Container com scroll para as mensagens */}
              <div className="max-h-64 overflow-y-auto pr-2 space-y-3 mb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {data.messages.map((message: any, index: number) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 bg-gray-50 p-3 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {message.contactName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.contactPhone}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              message.type === "sent"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {message.type === "sent" ? "Enviada" : "Recebida"}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-1 break-words text-sm">
                          {message.content}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>{message.sessionName}</span>
                          <span className="mx-1">•</span>
                          <span>
                            {new Date(message.timestamp).toLocaleString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-700">
                  Página {data.page} de {Math.ceil(data.total / data.limit)}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onLoadPage(Math.max(1, data.page - 1))}
                    disabled={data.page <= 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => onLoadPage(data.page + 1)}
                    disabled={data.page >= Math.ceil(data.total / data.limit)}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhuma mensagem encontrada no período selecionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
