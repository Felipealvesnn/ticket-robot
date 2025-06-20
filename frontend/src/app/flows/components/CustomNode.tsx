"use client";

import { Handle, Position } from "reactflow";

interface CustomNodeProps {
  id: string;
  data: {
    label: string;
    type: "start" | "message" | "condition" | "action" | "end";
    message?: string;
    condition?: string;
    action?: string;
  };
  selected?: boolean;
}

export default function CustomNode({ id, data, selected }: CustomNodeProps) {
  const getNodeStyle = () => {
    switch (data.type) {
      case "start":
        return {
          shape: "circle",
          bgColor: "bg-green-100",
          borderColor: "border-green-300",
          textColor: "text-green-800",
          iconColor: "text-green-600",
        };
      case "message":
        return {
          shape: "rectangle",
          bgColor: "bg-blue-100",
          borderColor: "border-blue-300",
          textColor: "text-blue-800",
          iconColor: "text-blue-600",
        };
      case "condition":
        return {
          shape: "diamond",
          bgColor: "bg-yellow-100",
          borderColor: "border-yellow-300",
          textColor: "text-yellow-800",
          iconColor: "text-yellow-600",
        };
      case "action":
        return {
          shape: "hexagon",
          bgColor: "bg-purple-100",
          borderColor: "border-purple-300",
          textColor: "text-purple-800",
          iconColor: "text-purple-600",
        };
      case "end":
        return {
          shape: "circle",
          bgColor: "bg-red-100",
          borderColor: "border-red-300",
          textColor: "text-red-800",
          iconColor: "text-red-600",
        };
      default:
        return {
          shape: "rectangle",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-300",
          textColor: "text-gray-800",
          iconColor: "text-gray-600",
        };
    }
  };

  const getIcon = () => {
    switch (data.type) {
      case "start":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "message":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "condition":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "action":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "end":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 12h14M12 5l7 7-7 7"
            />
          </svg>
        );
    }
  };

  const nodeStyle = getNodeStyle();

  // Renderizar diferentes formas
  const renderNodeShape = () => {
    const baseClasses = `${nodeStyle.bgColor} ${nodeStyle.borderColor} ${
      selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
    } border-2 shadow-lg`;

    switch (nodeStyle.shape) {
      case "circle":
        return (
          <div
            className={`w-24 h-24 rounded-full ${baseClasses} flex flex-col items-center justify-center relative`}
          >
            <Handle
              type="target"
              position={Position.Top}
              className="w-3 h-3 !bg-gray-400"
            />
            <div className={`${nodeStyle.iconColor} mb-1`}>{getIcon()}</div>
            <div
              className={`text-xs font-medium ${nodeStyle.textColor} text-center px-2 leading-tight`}
            >
              {data.label}
            </div>
            <Handle
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 !bg-gray-400"
            />
          </div>
        );

      case "diamond":
        return (
          <div className="relative">
            <Handle
              type="target"
              position={Position.Top}
              className="w-3 h-3 !bg-gray-400"
              style={{ top: "-8px" }}
            />
            <div
              className={`w-32 h-32 ${baseClasses} transform rotate-45 relative`}
              style={{
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
                <div className="text-center">
                  <div
                    className={`${nodeStyle.iconColor} mb-1 flex justify-center`}
                  >
                    {getIcon()}
                  </div>
                  <div
                    className={`text-xs font-medium ${nodeStyle.textColor} px-2 leading-tight`}
                  >
                    {data.label}
                  </div>
                </div>
              </div>
            </div>
            <Handle
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 !bg-gray-400"
              style={{ bottom: "-8px" }}
            />
          </div>
        );

      case "hexagon":
        return (
          <div className="relative">
            <Handle
              type="target"
              position={Position.Top}
              className="w-3 h-3 !bg-gray-400"
              style={{ top: "-8px" }}
            />
            <div
              className={`w-28 h-20 ${baseClasses} relative`}
              style={{
                clipPath:
                  "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className={`${nodeStyle.iconColor} mb-1 flex justify-center`}
                  >
                    {getIcon()}
                  </div>
                  <div
                    className={`text-xs font-medium ${nodeStyle.textColor} px-2 leading-tight`}
                  >
                    {data.label}
                  </div>
                </div>
              </div>
            </div>
            <Handle
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 !bg-gray-400"
              style={{ bottom: "-8px" }}
            />
          </div>
        );

      default: // rectangle
        return (
          <div
            className={`px-4 py-3 rounded-lg ${baseClasses} min-w-[180px] max-w-[280px] relative`}
          >
            <Handle
              type="target"
              position={Position.Top}
              className="w-3 h-3 !bg-gray-400"
            />

            <div className="flex items-center space-x-2 mb-2">
              <div className={`${nodeStyle.iconColor}`}>{getIcon()}</div>
              <div
                className={`font-medium text-sm ${nodeStyle.textColor} truncate`}
              >
                {data.label}
              </div>
            </div>

            {data.message && (
              <div className="text-xs text-gray-600 bg-white p-2 rounded border line-clamp-3 mb-2">
                {data.message}
              </div>
            )}

            {data.condition && (
              <div className="text-xs text-gray-600 bg-white p-2 rounded border mb-2">
                <span className="font-medium">Condição:</span> {data.condition}
              </div>
            )}

            {data.action && (
              <div className="text-xs text-gray-600 bg-white p-2 rounded border mb-2">
                <span className="font-medium">Ação:</span> {data.action}
              </div>
            )}

            <Handle
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 !bg-gray-400"
            />
          </div>
        );
    }
  };

  return renderNodeShape();
}
