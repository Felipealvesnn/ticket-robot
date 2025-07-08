"use client";

import {
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface ErrorNotificationProps {
  error: string | null;
  onClose: () => void;
}

export default function ErrorNotification({
  error,
  onClose,
}: ErrorNotificationProps) {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <ExclamationTriangleIcon className="w-5 h-5" />
      <span className="text-sm">{error}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200">
        <XCircleIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
