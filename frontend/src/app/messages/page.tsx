export default function MessagesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mensagens</h1>
        <p className="text-gray-600 mt-2">
          Envie e gerencie mensagens WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Conversas */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Conversas</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {[1, 2, 3, 4, 5].map((chat) => (
                <div
                  key={chat}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        C{chat}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Cliente {chat}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Última mensagem aqui...
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.floor(Math.random() * 24)}h
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
            {/* Header do Chat */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">C1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Cliente 1</p>
                  <p className="text-sm text-gray-500">+55 11 99999-9999</p>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm text-gray-900">
                    Olá! Como posso ajudar?
                  </p>
                  <span className="text-xs text-gray-500">14:30</span>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm">
                    Oi! Gostaria de saber sobre os produtos.
                  </p>
                  <span className="text-xs text-blue-200">14:32</span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm text-gray-900">
                    Claro! Temos várias opções disponíveis. Você tem algum
                    interesse específico?
                  </p>
                  <span className="text-xs text-gray-500">14:33</span>
                </div>
              </div>
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
