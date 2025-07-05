interface InputNodeData {
  message?: string; // Mensagem de prompt que será exibida ao usuário
  variableName?: string; // Nome da variável onde salvar o input
  validation?:
    | "text"
    | "email"
    | "phone"
    | "cpf"
    | "cnpj"
    | "number"
    | "cnh"
    | "plate"; // Tipo de validação
  placeholder?: string; // Placeholder para o input
  required?: boolean; // Se o campo é obrigatório
  errorMessage?: string; // Mensagem de erro personalizada
}

interface InputNodeProps {
  data: InputNodeData;
}

export default function InputNode({ data }: InputNodeProps) {
  return (
    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-cyan-800">
          Aguardando Input do Usuário
        </span>
      </div>

      {/* Mostrar mensagem de prompt */}
      {data.message ? (
        <div className="bg-white rounded border border-cyan-200 p-2 mb-2">
          <span className="text-xs text-gray-600">Pergunta: </span>
          <div className="text-sm text-gray-800 mt-1">{data.message}</div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
          <span className="text-xs text-red-600">
            ⚠️ Mensagem de prompt obrigatória
          </span>
        </div>
      )}

      {/* Mostrar variável que será salva */}
      {data.variableName && (
        <div className="bg-white rounded border border-cyan-200 p-2 mb-2">
          <span className="text-xs text-gray-600">Salvar em: </span>
          <span className="text-xs font-mono bg-cyan-100 text-cyan-800 px-1 rounded">
            ${data.variableName}
          </span>
        </div>
      )}

      {/* Mostrar tipo de validação */}
      <div className="space-y-2">
        {data.validation && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-cyan-600 font-medium">
              {data.validation === "text" && "📝 Texto"}
              {data.validation === "email" && "✉️ Email"}
              {data.validation === "phone" && "📞 Telefone"}
              {data.validation === "cpf" && "🆔 CPF"}
              {data.validation === "cnpj" && "🏢 CNPJ"}
              {data.validation === "number" && "🔢 Número"}
              {data.validation === "cnh" && "🚗 CNH"}
              {data.validation === "plate" && "🚙 Placa"}
            </span>
            {data.required && (
              <span className="text-xs text-red-500 font-medium">*</span>
            )}
          </div>
        )}

        {/* Status de configuração */}
        <div className="flex items-center gap-1">
          {data.message && data.variableName ? (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
              ✅ Configurado
            </span>
          ) : (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
              ⚠️ Configuração incompleta
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
