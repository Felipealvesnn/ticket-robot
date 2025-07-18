"use client";

import { MessageSquare, Plus } from "lucide-react";
import { FC } from "react";

interface EmptyStateProps {
  onCreateFlow: () => void;
}

export const EmptyState: FC<EmptyStateProps> = ({ onCreateFlow }) => {
  return (
    <div className="text-center py-12">
      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        Nenhum flow criado
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Comece criando seu primeiro flow de chatbot.
      </p>
      <div className="mt-6">
        <button
          onClick={onCreateFlow}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Primeiro Flow
        </button>
      </div>
    </div>
  );
};
