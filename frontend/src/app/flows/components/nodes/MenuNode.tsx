interface MenuOption {
  key: string;
  text: string;
  value: string;
  nextNodeId?: string;
}

interface MenuNodeData {
  options?: MenuOption[];
  allowFreeText?: boolean; // Se aceita texto livre além das opções
  caseSensitive?: boolean; // Se diferencia maiúscula/minúscula
  showOptions?: boolean; // Se mostra as opções numeradas
  invalidMessage?: string; // Mensagem para opção inválida
  isMainMenu?: boolean; // Flag para menu principal
}

interface MenuNodeProps {
  data: MenuNodeData;
  nodeType: "menu" | "mainMenu";
}

export default function MenuNode({ data, nodeType }: MenuNodeProps) {
  return (
    <div
      className={`bg-gradient-to-r ${
        nodeType === "mainMenu"
          ? "from-emerald-50 to-green-50 border-emerald-200"
          : "from-slate-50 to-gray-50 border-slate-200"
      } border rounded-lg p-3 mb-2`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-2 h-2 ${
            nodeType === "mainMenu" ? "bg-emerald-400" : "bg-slate-400"
          } rounded-full animate-pulse`}
        ></div>
        <span
          className={`text-sm font-semibold ${
            nodeType === "mainMenu" ? "text-emerald-800" : "text-slate-800"
          }`}
        >
          {nodeType === "mainMenu" ? "🏠 Menu Principal" : "📋 Menu Interativo"}
        </span>
      </div>
      <p
        className={`text-xs ${
          nodeType === "mainMenu" ? "text-emerald-700" : "text-slate-700"
        } mb-2`}
      >
        Apresenta opções ao usuário e roteia baseado na escolha
      </p>

      {/* Preview das opções */}
      {data.options && data.options.length > 0 && (
        <div className="bg-white rounded border border-gray-200 p-2 mb-2">
          <span className="text-xs text-gray-600 mb-1 block">
            Opções disponíveis:
          </span>
          <div className="space-y-1">
            {data.options.slice(0, 3).map((option, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">
                  {option.key}
                </span>
                <span className="text-gray-700">{option.text}</span>
                {option.nextNodeId && <span className="text-blue-500">→</span>}
              </div>
            ))}
            {data.options.length > 3 && (
              <div className="text-xs text-gray-500">
                +{data.options.length - 3} opções...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configurações do menu */}
      <div className="flex flex-wrap gap-1 text-xs">
        {data.showOptions !== false && (
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
            📋 Lista opções
          </span>
        )}
        {data.allowFreeText && (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
            📝 Texto livre
          </span>
        )}
        {!data.caseSensitive && (
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
            Aa Flexível
          </span>
        )}
        {nodeType === "mainMenu" && (
          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
            🏠 Principal
          </span>
        )}
      </div>
    </div>
  );
}
