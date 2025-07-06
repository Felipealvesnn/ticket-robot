/**
 * 🚦 Indicador de Status de Validação
 * Componente pequeno para mostrar status da validação
 */

import { AlertCircle, CheckCircle, HelpCircle, Loader2 } from "lucide-react";
import { FC } from "react";

interface FlowValidationStatusProps {
  status: "valid" | "invalid" | "unknown" | "validating";
  errorCount?: number;
  warningCount?: number;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  onClick?: () => void;
}

export const FlowValidationStatus: FC<FlowValidationStatusProps> = ({
  status,
  errorCount = 0,
  warningCount = 0,
  size = "md",
  showText = true,
  onClick,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-4 h-4";
      case "lg":
        return "w-6 h-6";
      default:
        return "w-5 h-5";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "lg":
        return "text-base";
      default:
        return "text-sm";
    }
  };

  const getContent = () => {
    switch (status) {
      case "valid":
        return {
          icon: (
            <CheckCircle className={`${getSizeClasses()} text-green-500`} />
          ),
          text: "Válido",
          textColor: "text-green-600",
          bgColor: "hover:bg-green-50",
        };
      case "invalid":
        return {
          icon: <AlertCircle className={`${getSizeClasses()} text-red-500`} />,
          text: `${errorCount} erro(s)`,
          textColor: "text-red-600",
          bgColor: "hover:bg-red-50",
        };
      case "validating":
        return {
          icon: (
            <Loader2
              className={`${getSizeClasses()} text-blue-500 animate-spin`}
            />
          ),
          text: "Validando...",
          textColor: "text-blue-600",
          bgColor: "hover:bg-blue-50",
        };
      default:
        return {
          icon: <HelpCircle className={`${getSizeClasses()} text-gray-400`} />,
          text: "Não validado",
          textColor: "text-gray-500",
          bgColor: "hover:bg-gray-50",
        };
    }
  };

  const content = getContent();

  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
        onClick ? `cursor-pointer ${content.bgColor}` : ""
      }`}
      title={
        status === "invalid"
          ? `${errorCount} erro(s), ${warningCount} aviso(s)`
          : content.text
      }
    >
      {content.icon}
      {showText && (
        <span className={`${getTextSize()} font-medium ${content.textColor}`}>
          {content.text}
        </span>
      )}
      {status === "invalid" && warningCount > 0 && showText && (
        <span className={`${getTextSize()} text-yellow-600`}>
          +{warningCount} aviso(s)
        </span>
      )}
    </Component>
  );
};

/**
 * 📊 Badge de estatísticas de validação
 */
interface ValidationStatsBadgeProps {
  errorCount: number;
  warningCount: number;
  totalNodes: number;
  size?: "sm" | "md";
}

export const ValidationStatsBadge: FC<ValidationStatsBadgeProps> = ({
  errorCount,
  warningCount,
  totalNodes,
  size = "md",
}) => {
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  if (totalNodes === 0) {
    return <div className={`${textSize} text-gray-500`}>Fluxo vazio</div>;
  }

  if (errorCount === 0 && warningCount === 0) {
    return (
      <div className={`${textSize} text-green-600 flex items-center gap-1`}>
        <CheckCircle className="w-3 h-3" />
        Sem problemas
      </div>
    );
  }

  return (
    <div className={`${textSize} flex items-center gap-2`}>
      {errorCount > 0 && (
        <span className="text-red-600 font-medium">
          {errorCount} erro{errorCount !== 1 ? "s" : ""}
        </span>
      )}
      {warningCount > 0 && (
        <span className="text-yellow-600">
          {warningCount} aviso{warningCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
};
