interface TicketNodeData {
  // Pode incluir configurações específicas de ticket no futuro
}

interface TicketNodeProps {
  data: TicketNodeData;
}

export default function TicketNode({ data }: TicketNodeProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
        <span className="text-sm font-semibold text-indigo-800">
          Sistema de Tickets
        </span>
      </div>
      <p className="text-xs text-indigo-700">
        Cria um ticket de suporte automaticamente
      </p>
    </div>
  );
}
