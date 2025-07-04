"use client";

import { FC } from "react";

interface IntegrationTabProps {
  node: any;
  nodeType: string;
  onUpdateProperty: (property: string, value: any) => void;
}

export const IntegrationTab: FC<IntegrationTabProps> = ({
  node,
  nodeType,
  onUpdateProperty,
}) => {
  return (
    <div className="space-y-4">
      {nodeType === "webhook" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Webhook
            </label>
            <input
              type="url"
              value={node.data?.webhookUrl || ""}
              onChange={(e) => onUpdateProperty("webhookUrl", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.exemplo.com/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método HTTP
            </label>
            <select
              value={node.data?.webhookMethod || "POST"}
              onChange={(e) =>
                onUpdateProperty("webhookMethod", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          {/* Autenticação */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              🔒 Autenticação
            </h4>

            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="useAuth"
                checked={node.data?.useAuthentication || false}
                onChange={(e) =>
                  onUpdateProperty("useAuthentication", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="useAuth"
                className="ml-2 block text-sm text-gray-700"
              >
                Usar autenticação
              </label>
            </div>

            {node.data?.useAuthentication && (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tipo de Autenticação
                  </label>
                  <select
                    value={node.data?.authType || "bearer"}
                    onChange={(e) =>
                      onUpdateProperty("authType", e.target.value)
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="bearer">Bearer Token</option>
                    <option value="api-key">API Key</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>

                {node.data?.authType === "bearer" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Token
                    </label>
                    <input
                      type="password"
                      value={node.data?.authToken || ""}
                      onChange={(e) =>
                        onUpdateProperty("authToken", e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="seu_token_aqui"
                    />
                  </div>
                )}

                {node.data?.authType === "api-key" && (
                  <>
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nome do Header
                      </label>
                      <input
                        type="text"
                        value={node.data?.apiKeyHeader || "X-API-Key"}
                        onChange={(e) =>
                          onUpdateProperty("apiKeyHeader", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="X-API-Key"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Valor da API Key
                      </label>
                      <input
                        type="password"
                        value={node.data?.apiKeyValue || ""}
                        onChange={(e) =>
                          onUpdateProperty("apiKeyValue", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="sua_api_key_aqui"
                      />
                    </div>
                  </>
                )}

                {node.data?.authType === "basic" && (
                  <>
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Usuário
                      </label>
                      <input
                        type="text"
                        value={node.data?.basicUsername || ""}
                        onChange={(e) =>
                          onUpdateProperty("basicUsername", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="usuário"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Senha
                      </label>
                      <input
                        type="password"
                        value={node.data?.basicPassword || ""}
                        onChange={(e) =>
                          onUpdateProperty("basicPassword", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="senha"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Dados do Payload */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              📦 Dados do Payload
            </h4>

            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="includeVariables"
                checked={node.data?.includeFlowVariables || false}
                onChange={(e) =>
                  onUpdateProperty("includeFlowVariables", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includeVariables"
                className="ml-2 block text-sm text-gray-700"
              >
                Incluir variáveis do fluxo (dados dos inputs)
              </label>
            </div>

            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="includeMetadata"
                checked={node.data?.includeMetadata || false}
                onChange={(e) =>
                  onUpdateProperty("includeMetadata", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includeMetadata"
                className="ml-2 block text-sm text-gray-700"
              >
                Incluir metadados (contato, sessão, empresa)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payload Personalizado (JSON)
              </label>
              <textarea
                value={node.data?.customPayload || ""}
                onChange={(e) =>
                  onUpdateProperty("customPayload", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none font-mono text-xs"
                placeholder={`{
  "custom_field": "valor",
  "outro_campo": "{{variavel_do_input}}"
}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {`{{variavel_nome}}`} para incluir variáveis do fluxo
              </p>
            </div>
          </div>

          {/* Resposta */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              📥 Processamento da Resposta
            </h4>

            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="waitForResponse"
                checked={node.data?.waitForResponse || false}
                onChange={(e) =>
                  onUpdateProperty("waitForResponse", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="waitForResponse"
                className="ml-2 block text-sm text-gray-700"
              >
                Aguardar resposta e salvar em variável
              </label>
            </div>

            {node.data?.waitForResponse && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nome da variável para salvar resposta
                </label>
                <input
                  type="text"
                  value={node.data?.responseVariable || ""}
                  onChange={(e) =>
                    onUpdateProperty("responseVariable", e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="webhook_response"
                />
              </div>
            )}
          </div>
        </>
      )}

      {nodeType === "database" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operação
            </label>
            <select
              value={node.data?.dbOperation || "SELECT"}
              onChange={(e) => onUpdateProperty("dbOperation", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SELECT">Consultar (SELECT)</option>
              <option value="INSERT">Inserir (INSERT)</option>
              <option value="UPDATE">Atualizar (UPDATE)</option>
              <option value="DELETE">Deletar (DELETE)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tabela
            </label>
            <input
              type="text"
              value={node.data?.dbTable || ""}
              onChange={(e) => onUpdateProperty("dbTable", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nome_da_tabela"
            />
          </div>
        </>
      )}
    </div>
  );
};
