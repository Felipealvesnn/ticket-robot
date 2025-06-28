"use client";

import { FC } from "react";

interface AdvancedTabProps {
  node: any;
  onUpdateProperty: (property: string, value: any) => void;
}

export const AdvancedTab: FC<AdvancedTabProps> = ({
  node,
  onUpdateProperty,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Posição
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">X</label>
            <input
              type="number"
              value={Math.round(node.position.x)}
              readOnly
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Y</label>
            <input
              type="number"
              value={Math.round(node.position.y)}
              readOnly
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Validação
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={node.data?.isValid || false}
              onChange={(e) => onUpdateProperty("isValid", e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Nó está válido</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={node.data?.hasError || false}
              onChange={(e) => onUpdateProperty("hasError", e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Mostrar erro</span>
          </label>
        </div>
      </div>
    </div>
  );
};
