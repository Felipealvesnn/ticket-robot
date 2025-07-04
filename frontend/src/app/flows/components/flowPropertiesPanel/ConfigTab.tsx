"use client";

import { FC } from "react";

interface ConfigTabProps {
  node: any;
  nodeType: string;
  onUpdateProperty: (property: string, value: any) => void;
}

export const ConfigTab: FC<ConfigTabProps> = ({
  node,
  nodeType,
  onUpdateProperty,
}) => {
  return (
    <div className="space-y-4">
      {nodeType === "input" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Variável
            </label>
            <input
              type="text"
              value={node.data?.variableName || ""}
              onChange={(e) => onUpdateProperty("variableName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: nome, email, telefone, cpf"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nome da variável onde o valor capturado será armazenado
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Validação
            </label>
            <select
              value={node.data?.validation || "text"}
              onChange={(e) => onUpdateProperty("validation", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">📝 Texto (qualquer texto)</option>
              <option value="email">✉️ Email</option>
              <option value="phone">📞 Telefone</option>
              <option value="cpf">🆔 CPF</option>
              <option value="cnpj">🏢 CNPJ</option>
              <option value="number">🔢 Número</option>
              <option value="cnh">🚗 CNH</option>
              <option value="plate">🚙 Placa de Veículo</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Tipo de validação que será aplicada ao input do usuário
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={node.data?.required || false}
              onChange={(e) => onUpdateProperty("required", e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="required"
              className="ml-2 block text-sm text-gray-700"
            >
              Campo obrigatório
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem de Erro Personalizada
            </label>
            <textarea
              value={node.data?.errorMessage || ""}
              onChange={(e) => onUpdateProperty("errorMessage", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="Mensagem exibida quando a validação falha (opcional)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se vazio, será usada a mensagem padrão baseada no tipo de
              validação
            </p>
          </div>
        </>
      )}

      {nodeType === "transfer" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem de Transferência
            </label>
            <textarea
              value={node.data?.transferMessage || ""}
              onChange={(e) =>
                onUpdateProperty("transferMessage", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="Aguarde um momento, vou transferir você para um de nossos atendentes..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departamento
            </label>
            <select
              value={node.data?.department || "geral"}
              onChange={(e) => onUpdateProperty("department", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="geral">Atendimento Geral</option>
              <option value="vendas">Vendas</option>
              <option value="suporte">Suporte Técnico</option>
              <option value="financeiro">Financeiro</option>
            </select>
          </div>
        </>
      )}

      {nodeType === "ticket" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria do Ticket
            </label>
            <select
              value={node.data?.ticketCategory || "geral"}
              onChange={(e) =>
                onUpdateProperty("ticketCategory", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="geral">Geral</option>
              <option value="bug">Reportar Bug</option>
              <option value="feature">Solicitar Funcionalidade</option>
              <option value="suporte">Suporte</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridade
            </label>
            <select
              value={node.data?.ticketPriority || "medium"}
              onChange={(e) =>
                onUpdateProperty("ticketPriority", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};
