"use client";

import { FC } from "react";

interface TimingTabProps {
  node: any;
  onUpdateProperty: (property: string, value: any) => void;
}

export const TimingTab: FC<TimingTabProps> = ({ node, onUpdateProperty }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tempo de Espera
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={node.data?.delay || 0}
            onChange={(e) =>
              onUpdateProperty("delay", parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5"
            min="0"
          />
          <select
            value={node.data?.delayUnit || "seconds"}
            onChange={(e) => onUpdateProperty("delayUnit", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="seconds">Segundos</option>
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mostrar Indicador de Digitação
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={node.data?.showTyping || false}
            onChange={(e) => onUpdateProperty("showTyping", e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">
            Simular que o bot está digitando
          </span>
        </label>
      </div>
    </div>
  );
};
