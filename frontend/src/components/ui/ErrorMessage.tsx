import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export default function ErrorMessage({
  message,
  onRetry,
  compact = false,
  className = "",
}: ErrorMessageProps) {
  if (compact) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 ${className}`}
      >
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-700 font-medium">Erro</p>
          <p className="text-red-600 text-sm">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Oops! Algo deu errado
          </h3>
          <p className="text-red-600 mb-4">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
