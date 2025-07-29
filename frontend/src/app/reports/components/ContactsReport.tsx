import type { ContactReport } from "@/services/api";

interface ContactsReportProps {
  data: ContactReport;
  onLoadPage: (page: number) => void;
}

export function ContactsReport({ data, onLoadPage }: ContactsReportProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Relatório de Contatos
            </h3>
            <span className="text-sm text-gray-500">
              Total: {data.total} contatos
            </span>
          </div>

          {data.contacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensagens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primeiro Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Mensagem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.contacts.map((contact: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 text-center">
                          {contact.messageCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(contact.firstContactAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(contact.lastMessageAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contact.status === "active"
                              ? "bg-green-100 text-green-800"
                              : contact.status === "blocked"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {contact.status === "active"
                            ? "Ativo"
                            : contact.status === "blocked"
                            ? "Bloqueado"
                            : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <span className="text-sm text-gray-700">
                  Página {data.page} de {Math.ceil(data.total / data.limit)}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onLoadPage(Math.max(1, data.page - 1))}
                    disabled={data.page <= 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => onLoadPage(data.page + 1)}
                    disabled={data.page >= Math.ceil(data.total / data.limit)}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum contato encontrado no período selecionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
