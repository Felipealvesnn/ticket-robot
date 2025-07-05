import { useState } from "react";

interface MenuOptionConfig {
  key: string;
  text: string;
  actionType: "existing" | "new";
  // Para conectar a node existente
  existingNodeId?: string;
  // Para criar novo node
  newNodeType?: "webhook" | "message" | "transfer" | "menu" | "input";
  newNodeData?: any;
}

interface MenuConfiguratorProps {
  onSave: (options: MenuOptionConfig[]) => void;
}

export default function MenuConfigurator({ onSave }: MenuConfiguratorProps) {
  const [options, setOptions] = useState<MenuOptionConfig[]>([]);

  const addOption = () => {
    setOptions([
      ...options,
      {
        key: "",
        text: "",
        actionType: "existing",
      },
    ]);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Configurar Opções do Menu</h3>

      {options.map((option, index) => (
        <div key={index} className="border rounded p-3 mb-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tecla</label>
              <input
                type="text"
                value={option.key}
                onChange={(e) => updateOption(index, "key", e.target.value)}
                placeholder="1, 2, 9..."
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Texto</label>
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(index, "text", e.target.value)}
                placeholder="Falar com Vendas"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-2">Ação</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`action-${index}`}
                  checked={option.actionType === "existing"}
                  onChange={() => updateOption(index, "actionType", "existing")}
                  className="mr-2"
                />
                Conectar a node existente
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`action-${index}`}
                  checked={option.actionType === "new"}
                  onChange={() => updateOption(index, "actionType", "new")}
                  className="mr-2"
                />
                Criar novo node
              </label>
            </div>
          </div>

          {option.actionType === "existing" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Node Existente
              </label>
              <select
                value={option.existingNodeId || ""}
                onChange={(e) =>
                  updateOption(index, "existingNodeId", e.target.value)
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Selecione um node...</option>
                <option value="webhook-1">🔗 Webhook API</option>
                <option value="transfer-1">🎧 Transferir Atendimento</option>
                <option value="menu-2">📋 Menu Secundário</option>
              </select>
            </div>
          )}

          {option.actionType === "new" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo do Novo Node
              </label>
              <select
                value={option.newNodeType || ""}
                onChange={(e) =>
                  updateOption(index, "newNodeType", e.target.value)
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Selecione o tipo...</option>
                <option value="webhook">🔗 Webhook</option>
                <option value="message">💬 Mensagem</option>
                <option value="transfer">🎧 Transferir Atendimento</option>
                <option value="menu">📋 Novo Menu</option>
                <option value="input">📝 Capturar Dados</option>
              </select>

              {option.newNodeType === "webhook" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">
                    URL do Webhook
                  </label>
                  <input
                    type="url"
                    placeholder="https://api.exemplo.com/webhook"
                    className="w-full px-3 py-2 border rounded"
                    onChange={(e) =>
                      updateOption(index, "newNodeData", {
                        ...option.newNodeData,
                        webhookUrl: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {option.newNodeType === "message" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">
                    Mensagem
                  </label>
                  <textarea
                    placeholder="Digite a mensagem..."
                    className="w-full px-3 py-2 border rounded"
                    onChange={(e) =>
                      updateOption(index, "newNodeData", {
                        ...option.newNodeData,
                        message: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setOptions(options.filter((_, i) => i !== index))}
            className="text-red-600 text-sm mt-2"
          >
            🗑️ Remover opção
          </button>
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={addOption}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ➕ Adicionar Opção
        </button>

        <button
          onClick={() => onSave(options)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          💾 Salvar Menu
        </button>
      </div>
    </div>
  );
}
