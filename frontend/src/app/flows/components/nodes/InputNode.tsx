interface InputNodeData {
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
      <p className="text-xs text-cyan-700 mb-2">
        Captura dados digitados pelo usuário
      </p>

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
    </div>
  );
}
