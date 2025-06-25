import { useSocketStore } from "@/store/socket";
import React from "react";

interface SocketIndicatorProps {
  className?: string;
}

export const SocketIndicator: React.FC<SocketIndicatorProps> = ({
  className = "",
}) => {
  const { isConnected, error, reconnectAttempts } = useSocketStore();

  const getStatusColor = () => {
    if (error) return "text-red-500";
    if (isConnected) return "text-green-500";
    return "text-yellow-500";
  };

  const getStatusText = () => {
    if (error) return "Desconectado";
    if (isConnected) return "Conectado";
    if (reconnectAttempts > 0) return `Reconectando... (${reconnectAttempts})`;
    return "Conectando...";
  };
  const getStatusIcon = () => {
    if (error) {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    }

    if (isConnected) {
      return <div className="w-3 h-3 rounded-full bg-current"></div>;
    }

    return (
      <div className="w-3 h-3 rounded-full bg-current animate-pulse"></div>
    );
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center justify-center ${getStatusColor()}`}>
        {getStatusIcon()}
      </div>
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
};

export default SocketIndicator;
