interface ConditionNodeData {
  conditions?: Array<{
    id: string;
    field: string;
    operator: string;
    value: string;
    label?: string;
    targetNodeId?: string;
    targetNodeType?: string;
  }>;
}

interface ConditionNodeProps {
  data: ConditionNodeData;
}

export default function ConditionNode({ data }: ConditionNodeProps) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
        <span className="text-sm font-semibold text-orange-800">
          Decisão Inteligente
        </span>
      </div>
      <p className="text-xs text-orange-700 mb-2">
        Direciona o fluxo baseado em condições
      </p>

      {/* Preview das condições */}
      {data.conditions && data.conditions.length > 0 && (
        <div className="bg-white rounded border border-orange-200 p-2 mb-2">
          <span className="text-xs text-gray-600 mb-1 block">
            Condições configuradas:
          </span>
          <div className="space-y-1">
            {data.conditions.slice(0, 3).map((condition, index) => (
              <div
                key={condition.id}
                className="flex items-center gap-2 text-xs"
              >
                <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-mono">
                  {condition.label || `C${index + 1}`}
                </span>
                <div className="flex items-center gap-1 text-gray-700">
                  {/* Indicar se é variável */}
                  {condition.field.startsWith("$") ||
                  !["message", "user_message", "mensagem"].includes(
                    condition.field
                  ) ? (
                    <span className="bg-blue-100 text-blue-700 px-1 rounded font-mono text-xs">
                      ${condition.field}
                    </span>
                  ) : (
                    <span>{condition.field}</span>
                  )}
                  <span>{condition.operator}</span>
                  <span>"{condition.value}"</span>
                </div>
                {condition.targetNodeId && (
                  <span className="text-blue-500">→</span>
                )}
              </div>
            ))}
            {data.conditions.length > 3 && (
              <div className="text-xs text-gray-500">
                +{data.conditions.length - 3} condições...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Indicador de configuração */}
      <div className="flex items-center gap-1">
        {data.conditions && data.conditions.length > 0 ? (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
            ✅ {data.conditions.length} condição(ões)
          </span>
        ) : (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
            ⚠️ Sem condições
          </span>
        )}
      </div>
    </div>
  );
}
