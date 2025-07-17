"use client";

import { SystemStatus } from "@/types/dashboard";

interface PerformanceBannerProps {
  systemStatus: SystemStatus;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function PerformanceBanner({
  systemStatus,
  isLoading,
  onRefresh,
}: PerformanceBannerProps) {
  if (isLoading) {
    return (
      <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-48 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="w-16 h-8 bg-gray-200 rounded"></div>
            <div className="w-16 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div
              className={`w-10 h-10 ${
                systemStatus.isOnline ? "bg-green-100" : "bg-red-100"
              } rounded-full flex items-center justify-center`}
            >
              <svg
                className={`w-5 h-5 ${
                  systemStatus.isOnline ? "text-green-600" : "text-red-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {systemStatus.isOnline ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {systemStatus.isOnline
                ? "Sistema Operacional"
                : "Sistema com Problemas"}
            </h3>
            <p className="text-sm text-gray-600">
              {systemStatus.isOnline
                ? "Todos os serviços funcionando normalmente"
                : "Verificando conectividade..."}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-gray-500 text-sm">Uptime</div>
            <div className="font-semibold text-gray-900">
              {systemStatus.uptime}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 text-sm">Latência</div>
            <div className="font-semibold text-gray-900">
              {systemStatus.latency}
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Atualizar dados"
            >
              <svg
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
