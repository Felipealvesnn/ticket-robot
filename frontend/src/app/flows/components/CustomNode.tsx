"use client";

import { Handle, Position } from "reactflow";

interface CustomNodeProps {
  data: {
    label: string;
    message?: string;
    condition?: string;
    action?: string;
  };
  selected?: boolean;
}

export default function CustomNode({ data, selected }: CustomNodeProps) {
  const getNodeColor = () => {
    if (data.message) return "bg-blue-50 border-blue-200";
    if (data.condition) return "bg-yellow-50 border-yellow-200";
    if (data.action) return "bg-green-50 border-green-200";
    return "bg-gray-50 border-gray-200";
  };

  const getIconColor = () => {
    if (data.message) return "text-blue-600";
    if (data.condition) return "text-yellow-600";
    if (data.action) return "text-green-600";
    return "text-gray-600";
  };

  const getIcon = () => {
    if (data.message) {
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
    }
    if (data.condition) {
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
    }
    if (data.action) {
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
    }
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
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[200px] max-w-[300px] ${getNodeColor()} ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center space-x-2 mb-2">
        <div className={`${getIconColor()}`}>{getIcon()}</div>
        <div className="font-medium text-sm text-gray-900 truncate">
          {data.label}
        </div>
      </div>

      {data.message && (
        <div className="text-xs text-gray-600 bg-white p-2 rounded border line-clamp-3">
          {data.message}
        </div>
      )}

      {data.condition && (
        <div className="text-xs text-gray-600 bg-white p-2 rounded border">
          Condição: {data.condition}
        </div>
      )}

      {data.action && (
        <div className="text-xs text-gray-600 bg-white p-2 rounded border">
          Ação: {data.action}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
