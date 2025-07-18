"use client";

import { Edit, Info, Trash2 } from "lucide-react";
import { FC } from "react";

interface EdgeContextMenuProps {
  edgeId: string;
  position: { x: number; y: number };
  onDelete: (edgeId: string) => void;
  onClose: () => void;
}

export const EdgeContextMenu: FC<EdgeContextMenuProps> = ({
  edgeId,
  position,
  onDelete,
  onClose,
}) => {
  return (
    <>
      {/* Overlay para fechar o menu ao clicar fora */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu contextual */}
      <div
        className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
          Conexão: {edgeId.substring(0, 20)}...
        </div>

        <button
          onClick={() => {
            // TODO: Implementar edição de label da edge
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
          disabled
          title="Em desenvolvimento"
        >
          <Edit className="w-4 h-4" />
          Editar Label
          <span className="ml-auto text-xs text-gray-400">(Em breve)</span>
        </button>

        <button
          onClick={() => {
            // TODO: Implementar informações da edge
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
          disabled
          title="Em desenvolvimento"
        >
          <Info className="w-4 h-4" />
          Propriedades
          <span className="ml-auto text-xs text-gray-400">(Em breve)</span>
        </button>

        <div className="border-t border-gray-100 my-1" />

        <button
          onClick={() => {
            onDelete(edgeId);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Deletar Conexão
          <span className="ml-auto text-xs text-gray-400">Del</span>
        </button>
      </div>
    </>
  );
};
