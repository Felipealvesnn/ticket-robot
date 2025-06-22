"use client";

import { BarChart3, Folder, Plus, Settings } from "lucide-react";
import { FC } from "react";
import { useFlowsStore } from "@/store";

export const FlowBuilderSidebar: FC = () => {
  const { flows, currentFlow, setCurrentFlow } = useFlowsStore();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Flows</h3>
      </div>

      {/* Flows List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            Novo Flow
          </button>
        </div>

        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Seus Flows</h4>
          <div className="space-y-2">
            {flows.map((flow) => (
              <div
                key={flow.id}
                onClick={() => setCurrentFlow(flow)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentFlow?.id === flow.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <Folder size={16} className="text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {flow.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {flow.nodes?.length || 0} nós
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <BarChart3 size={16} />
          Analytics
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Settings size={16} />
          Configurações
        </button>
      </div>
    </div>
  );
};
