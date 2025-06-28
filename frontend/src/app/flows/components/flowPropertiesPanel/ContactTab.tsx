"use client";

import { FC } from "react";

interface ContactTabProps {
  node: any;
  nodeType: string;
  onUpdateProperty: (property: string, value: any) => void;
}

export const ContactTab: FC<ContactTabProps> = ({
  node,
  nodeType,
  onUpdateProperty,
}) => {
  return (
    <div className="space-y-4">
      {nodeType === "email" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assunto do Email
            </label>
            <input
              type="text"
              value={node.data?.emailSubject || ""}
              onChange={(e) => onUpdateProperty("emailSubject", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Assunto do email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template do Email
            </label>
            <textarea
              value={node.data?.emailTemplate || ""}
              onChange={(e) =>
                onUpdateProperty("emailTemplate", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="Conteúdo do email..."
            />
          </div>
        </>
      )}

      {nodeType === "phone" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Telefone
            </label>
            <input
              type="tel"
              value={node.data?.phoneNumber || ""}
              onChange={(e) => onUpdateProperty("phoneNumber", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+55 11 99999-9999"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem de Áudio (opcional)
            </label>
            <textarea
              value={node.data?.audioMessage || ""}
              onChange={(e) => onUpdateProperty("audioMessage", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="Mensagem que será convertida em áudio..."
            />
          </div>
        </>
      )}
    </div>
  );
};
