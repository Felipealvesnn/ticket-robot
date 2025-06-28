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
