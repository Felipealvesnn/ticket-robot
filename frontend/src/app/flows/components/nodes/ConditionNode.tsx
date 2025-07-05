interface ConditionNodeData {
  conditions?: any[];
}

interface ConditionNodeProps {
  data: ConditionNodeData;
}

export default function ConditionNode({ data }: ConditionNodeProps) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-2 mb-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
        <span className="text-xs font-semibold text-orange-800">
          Decisão Inteligente
        </span>
      </div>
      <p className="text-xs text-orange-700 mt-1">
        Direciona o fluxo baseado em condições
      </p>
    </div>
  );
}
