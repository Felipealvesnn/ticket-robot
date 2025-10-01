"use client";

import { Ticket } from "@/store/tickets";
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TicketIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  loading: boolean;
  onSelectTicket: (ticket: Ticket) => void;
  onReopenTicket: (ticketId: string) => void;
  onCloseTicket: (ticketId: string) => void;
}

export default function TicketList({
  tickets,
  selectedTicketId,
  loading,
  onSelectTicket,
  onReopenTicket,
  onCloseTicket,
}: TicketListProps) {
  const [errorTickets, setErrorTickets] = useState<Set<string>>(new Set());

  const handleTicketClick = async (ticket: Ticket) => {
    try {
      console.log("🎫 Tentando selecionar ticket:", ticket.id);
      await onSelectTicket(ticket);
    } catch (error) {
      console.error("❌ Erro ao selecionar ticket:", error);
      setErrorTickets((prev) => new Set([...prev, ticket.id]));

      // Remover erro após 5 segundos
      setTimeout(() => {
        setErrorTickets((prev) => {
          const newSet = new Set(prev);
          newSet.delete(ticket.id);
          return newSet;
        });
      }, 5000);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "WAITING_CUSTOMER":
        return "bg-yellow-100 text-yellow-800";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Aberto";
      case "IN_PROGRESS":
        return "Em Progresso";
      case "WAITING_CUSTOMER":
        return "Aguardando";
      case "CLOSED":
        return "Fechado";
      default:
        return status;
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
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
          Tickets ({tickets.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse p-3 border-b border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-gray-500 p-8">
            <div>
              <TicketIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Nenhum ticket encontrado</p>
              <p className="text-xs text-gray-400 mt-1">
                Ajuste os filtros ou aguarde novas conversas
              </p>
            </div>
          </div>
        ) : (
          tickets
            .map((ticket) => {
              // 🔥 VERIFICAÇÕES DE SEGURANÇA para evitar crashes
              if (!ticket || !ticket.id) {
                console.warn("⚠️ Ticket inválido encontrado:", ticket);
                return null;
              }

              if (!ticket.contact) {
                console.warn("⚠️ Ticket sem contact:", ticket.id);
                return null;
              }

              if (!ticket.messagingSession) {
                console.warn("⚠️ Ticket sem messagingSession:", ticket.id);
                return null;
              }

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className={`relative p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                    selectedTicketId === ticket.id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : errorTickets.has(ticket.id)
                      ? "bg-red-50 border-l-4 border-l-red-500"
                      : "hover:border-l-4 hover:border-l-gray-300"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          ticket.status === "CLOSED"
                            ? "bg-gray-400"
                            : ticket.status === "OPEN"
                            ? "bg-green-500"
                            : ticket.status === "IN_PROGRESS"
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {ticket.contact?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ticket.contact?.name || "Contato sem nome"}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">
                            {getStatusText(ticket.status)}
                          </span>
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 truncate mb-1">
                        {ticket.contact?.phoneNumber ||
                          "Telefone não informado"}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 truncate">
                          {ticket.messagingSession?.name ||
                            "Sessão não informada"}
                        </span>
                        <div className="flex flex-col items-end text-xs text-gray-400 flex-shrink-0 ml-2">
                          {ticket.status === "CLOSED" && ticket.closedAt ? (
                            <>
                              <span className="text-red-600 font-medium">
                                Fechado
                              </span>
                              <span>
                                {new Date(ticket.closedAt).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </>
                          ) : ticket.lastMessageAt ? (
                            <span>
                              {new Date(
                                ticket.lastMessageAt
                              ).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span>Sem data</span>
                          )}
                        </div>
                      </div>

                      {/* Indicador de mensagens e status */}
                      {ticket._count?.messages &&
                        ticket._count.messages > 0 && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {ticket._count.messages} mensagem
                              {ticket._count.messages !== 1 ? "s" : ""}
                            </span>
                            <div className="flex items-center space-x-1">
                              {ticket.status === "OPEN" && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                              {ticket.status === "IN_PROGRESS" && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              {ticket.status === "CLOSED" && (
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              )}
                              {/* Indicador de última atividade (apenas para tickets ativos) */}
                              {ticket.status !== "CLOSED" &&
                                ticket.lastMessageAt &&
                                new Date(ticket.lastMessageAt) >
                                  new Date(Date.now() - 5 * 60 * 1000) && (
                                  <span className="text-xs bg-red-500 text-white px-1 rounded-full">
                                    NOVO
                                  </span>
                                )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Ações rápidas */}
                  {selectedTicketId === ticket.id && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center space-x-1">
                        {ticket.status === "CLOSED" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReopenTicket(ticket.id);
                            }}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Reabrir ticket"
                          >
                            <ArrowPathIcon className="w-3 h-3" />
                          </button>
                        )}

                        {ticket.status === "IN_PROGRESS" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseTicket(ticket.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Encerrar ticket"
                          >
                            <XCircleIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Indicador de erro */}
                  {errorTickets.has(ticket.id) && (
                    <div className="absolute top-2 left-2">
                      <div className="flex items-center text-red-600">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span className="text-xs ml-1">Erro ao carregar</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
            .filter(Boolean) // 🔥 Remove elementos null das verificações de segurança
        )}
      </div>
    </div>
  );
}
