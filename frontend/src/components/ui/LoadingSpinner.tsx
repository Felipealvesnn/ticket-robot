import { RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({
  message = "Carregando...",
  size = "md",
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const containerClasses = fullScreen
    ? "flex items-center justify-center min-h-screen"
    : "flex items-center justify-center py-8";

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex items-center gap-3">
        <RefreshCw
          className={`animate-spin text-blue-600 ${sizeClasses[size]}`}
        />
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  );
}
