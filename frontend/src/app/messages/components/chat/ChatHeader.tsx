"use client";

import { Ticket } from "@/store/tickets";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface ChatHeaderProps {
  ticket: Ticket;
  onReopenTicket: (ticketId: string) => void;
  onCloseTicket: (ticketId: string) => void;
}

export default function ChatHeader({
  ticket,
  onReopenTicket,
  onCloseTicket,
}: ChatHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "WAITING_CUSTOMER":
        return "bg-yellow-100 text-yellow-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <ClockIcon className="w-4 h-4" />;
      case "WAITING_CUSTOMER":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case "CLOSED":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <XCircleIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 relative z-20 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
              ticket.status === "CLOSED"
                ? "bg-gray-400"
                : ticket.status === "OPEN"
                ? "bg-green-500"
                : ticket.status === "IN_PROGRESS"
                ? "bg-blue-500"
                : "bg-yellow-500"
            }`}
          >
            {ticket.contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {ticket.contact.name}
            </p>
            <p className="text-xs text-gray-500 flex items-center">
              <PhoneIcon className="w-3 h-3 mr-1" />
              {ticket.contact.phoneNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status */}
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              ticket.status
            )}`}
          >
            {getStatusIcon(ticket.status)}
            <span className="ml-1">
              {ticket.status === "OPEN"
                ? "Aberto"
                : ticket.status === "IN_PROGRESS"
                ? "Em Progresso"
                : ticket.status === "WAITING_CUSTOMER"
                ? "Aguardando"
                : "Fechado"}
            </span>
          </span>

          {/* Ações */}
          <div className="flex items-center space-x-1">
            {ticket.status === "CLOSED" ? (
              <button
                onClick={() => onReopenTicket(ticket.id)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <ArrowPathIcon className="w-3 h-3 mr-1" />
                Reabrir
              </button>
            ) : (
              <button
                onClick={() => onCloseTicket(ticket.id)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                <CheckIcon className="w-3 h-3 mr-1" />
                Encerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
