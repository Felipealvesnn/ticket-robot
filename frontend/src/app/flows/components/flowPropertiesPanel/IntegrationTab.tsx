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
              <option value="DELETE">DELETE</option>
            </select>
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
