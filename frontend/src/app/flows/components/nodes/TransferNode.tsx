interface TransferNodeData {
  // Pode incluir configurações específicas de transferência no futuro
}

interface TransferNodeProps {
  data: TransferNodeData;
}

export default function TransferNode({ data }: TransferNodeProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-blue-800">
          Atendimento Humano
        </span>
      </div>
      <p className="text-xs text-blue-700">
        Transfere a conversa para um atendente disponível
      </p>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-xs text-green-600 font-medium">
          ⚡ Prioridade Alta
        </span>
      </div>
    </div>
  );
}
