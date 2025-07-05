interface WebhookNodeData {
  webhookUrl?: string; // URL do webhook
  webhookMethod?: string; // Método HTTP
  useAuthentication?: boolean; // Se usar autenticação
  authType?: string; // Tipo de autenticação
  authToken?: string; // Token de autenticação
  apiKeyHeader?: string; // Nome do header da API key
  apiKeyValue?: string; // Valor da API key
  basicUsername?: string; // Usuário para basic auth
  basicPassword?: string; // Senha para basic auth
  includeFlowVariables?: boolean; // Se incluir variáveis do fluxo
  includeMetadata?: boolean; // Se incluir metadados
  customPayload?: string; // Payload personalizado
  waitForResponse?: boolean; // Se aguardar resposta
  responseVariable?: string; // Nome da variável para salvar resposta
}

interface WebhookNodeProps {
  data: WebhookNodeData;
}

export default function WebhookNode({ data }: WebhookNodeProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
        <span className="text-sm font-semibold text-indigo-800">
          HTTP Webhook
        </span>
      </div>
      <p className="text-xs text-indigo-700 mb-2">
        Faz requisição HTTP para sistema externo
      </p>

      {data.webhookUrl && (
        <div className="bg-white rounded border border-indigo-200 p-2 mb-2">
          <span className="text-xs text-gray-600">URL: </span>
          <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-1 rounded break-all">
            {data.webhookUrl}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs">
        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
          {data.webhookMethod || "POST"}
        </span>
        {data.useAuthentication && (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
            🔒 Auth
          </span>
        )}
        {data.includeFlowVariables && (
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
            📦 Dados
          </span>
        )}
        {data.waitForResponse && (
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
            📥 Resposta
          </span>
        )}
      </div>
    </div>
  );
}
