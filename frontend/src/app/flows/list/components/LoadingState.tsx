"use client";

import { FC } from "react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: FC<LoadingStateProps> = ({
  message = "Carregando flows...",
}) => {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};
