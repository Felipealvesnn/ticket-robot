"use client";

import { FC } from "react";
import { Handle, Position } from "reactflow";

interface CustomNodeProps {
  data: {
    label?: string;
    description?: string;
    message?: string;
  };
  selected?: boolean;
}

export const CustomNode: FC<CustomNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${
        selected ? "border-blue-500" : "border-gray-200"
      } min-w-[150px]`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-blue-100">
          <span className="text-blue-600 text-lg">💬</span>
        </div>
        <div className="ml-2 flex-1">
          <div className="text-lg font-bold">
            {data?.label || "Nó Personalizado"}
          </div>
          <div className="text-gray-500 text-sm">
            {data?.description || "Descrição do nó"}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
