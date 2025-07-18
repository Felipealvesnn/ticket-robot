"use client";

import { Plus } from "lucide-react";
import { FC } from "react";

interface FlowsHeaderProps {
  onCreateFlow: () => void;
}

export const FlowsHeader: FC<FlowsHeaderProps> = ({ onCreateFlow }) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Flows de Chatbot
            </h1>
            <p className="mt-2 text-gray-600">
              Gerencie e edite seus flows de conversação
            </p>
          </div>
          <button
            onClick={onCreateFlow}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Flow
          </button>
        </div>
      </div>
    </header>
  );
};
