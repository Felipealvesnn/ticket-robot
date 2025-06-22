"use client";

import {
  BarChart3,
  MoreHorizontal,
  Play,
  Save,
  Settings,
  Zap,
} from "lucide-react";
import { useFlowsStore } from "@/store";


export const FlowBuilderHeader = () => {
  const { currentFlow, saveCurrentFlow } = useFlowsStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Flow Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Flow Builder
            </h1>
          </div>

          {currentFlow && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">•</span>
              <h2 className="text-lg font-medium text-gray-700">
                {currentFlow.name}
              </h2>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  currentFlow.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {currentFlow.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3">
          {" "}
          {/* Analytics */}
          <button
            onClick={() => console.log("Analytics clicked")}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
          {/* Test Flow */}
          <button
            onClick={() => console.log("Test clicked")}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Testar</span>
          </button>
          {/* Save */}
          <button
            onClick={saveCurrentFlow}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
          {/* Settings */}
          <button
            onClick={() => console.log("Settings clicked")}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          {/* More Options */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
