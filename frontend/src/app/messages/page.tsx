"use client";

import { useRealtimeSystem } from "@/hooks/useRealtimeSystem";
import { useSelectedTicket, useTickets } from "@/store/tickets";
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function TicketsPage() {
  // ===== HOOKS =====
  const {
    tickets,
    loading,
    filters,
    setFilters,
    loadTickets,
    refreshTickets,
    reopenTicket: reopenTicketAction,
    // ===== PAGINAÇÃO =====
    currentPage,
    totalPages,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = useTickets();

  const {
    selectedTicket,
    messages,
    selectTicket,
    sendMessage,
    reopenTicket: reopenSelectedTicket,
    closeTicket: closeSelectedTicket,
  } = useSelectedTicket();

  // Sistema unificado de sessões e mensagens em tempo real
  const realtimeSystem = useRealtimeSystem();

  // ===== ESTADOS =====
  const [messageText, setMessageText] = useState("");

  // ===== EFEITOS =====

  // Carregar tickets ao inicializar a página
  useEffect(() => {
    console.log("🎫 Carregando tickets da API...");
    loadTickets(); // Carregar tickets diretamente
  }, [loadTickets]);

  // Log para debug das mensagens em tempo real
  useEffect(() => {
    console.log("🔄 Sistema de tempo real:", realtimeSystem);
  }, [realtimeSystem]);

  // Aplicar filtros aos tickets (já feito no store, mas mantido para compatibilidade)
  const filteredTickets = tickets;

  // Função para reabrir ticket
  const handleReopenTicket = async (ticketId: string) => {
    try {
      if (selectedTicket?.id === ticketId) {
        await reopenSelectedTicket(ticketId, "Reaberto pelo atendente");
      } else {
        await reopenTicketAction(ticketId, "Reaberto pelo atendente");
      }
    } catch (error) {
      console.error("Erro ao reabrir ticket:", error);
    }
  };

  // Função para fechar ticket
  const handleCloseTicket = async (ticketId: string) => {
    try {
      const confirmClose = window.confirm(
        "Tem certeza que deseja encerrar este ticket?"
      );

      if (!confirmClose) return;

      // Usar a ação correta de fechar ticket
      await closeSelectedTicket(ticketId, "Encerrado pelo atendente");
    } catch (error) {
      console.error("Erro ao encerrar ticket:", error);
    }
  };

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!selectedTicket || !messageText.trim()) return;

    try {
      await sendMessage({
        ticketId: selectedTicket.id,
        content: messageText.trim(),
        messageType: "TEXT",
      });
      setMessageText("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  // Helper functions para UI
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
        return <ClockIcon className="w-4 h-4" />;
      case "CLOSED":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <XCircleIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <TicketIcon className="w-8 h-8 mr-3 text-blue-600" />
          Tickets & Conversas
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie tickets de atendimento e conversas do WhatsApp
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Busca */}
            <div className="relative flex-1 min-w-64">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone ou ticket..."
                value={filters.search || ""}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro Status */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={filters.status || "ALL"}
                onChange={(e) => setFilters({ status: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos</option>
                <option value="OPEN">Abertos</option>
                <option value="CLOSED">Fechados</option>
              </select>
            </div>

            {/* Filtro Sessão */}
            <select
              value={filters.sessionId || "ALL"}
              onChange={(e) => setFilters({ sessionId: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas as Sessões</option>
              {realtimeSystem.sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} ({session.status})
                </option>
              ))}
            </select>

            {/* Filtro Prioridade */}
            <select
              value={filters.priority || "ALL"}
              onChange={(e) => setFilters({ priority: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas as Prioridades</option>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>

            {/* Filtro de Data */}
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={filters.dateRange?.start || ""}
                onChange={(e) =>
                  setFilters({
                    dateRange: {
                      ...filters.dateRange,
                      start: e.target.value,
                    },
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={filters.dateRange?.end || ""}
                onChange={(e) =>
                  setFilters({
                    dateRange: {
                      ...filters.dateRange,
                      end: e.target.value,
                    },
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Lista de Tickets */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                  Tickets ({filteredTickets.length})
                </h3>
                <button
                  onClick={refreshTickets}
                  disabled={loading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Atualizar tickets"
                >
                  <ArrowPathIcon
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <TicketIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum ticket encontrado</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => selectTicket(ticket)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            ticket.status === "CLOSED"
                              ? "bg-gray-100"
                              : "bg-blue-100"
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${
                              ticket.status === "CLOSED"
                                ? "text-gray-600"
                                : "text-blue-600"
                            }`}
                          >
                            #{ticket.id.slice(-3)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {ticket.contact.name}
                          </p>
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
                                ? "Em Andamento"
                                : ticket.status === "WAITING_CUSTOMER"
                                ? "Aguardando"
                                : "Fechado"}
                            </span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {ticket.contact.phoneNumber}
                        </p>
                        <p className="text-xs text-gray-400">
                          {ticket.messagingSession.name}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(ticket.lastMessageAt).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                          <div className="flex items-center space-x-2">
                            {/* Indicador de mensagens não lidas */}
                            {ticket._count?.messages &&
                              ticket._count.messages > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {ticket._count.messages} msg
                                </span>
                              )}
                            {ticket.status === "CLOSED" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopenTicket(ticket.id);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Reabrir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Página {currentPage} de {totalPages}
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value={5}>5 por página</option>
                      <option value={10}>10 por página</option>
                      <option value={20}>20 por página</option>
                      <option value={50}>50 por página</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      ‹ Anterior
                    </button>

                    {/* Mostrar páginas */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 py-1 text-sm border rounded ${
                            pageNum === currentPage
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Próximo ›
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Área do Chat */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            {selectedTicket ? (
              <>
                {/* Header do Chat */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedTicket.status === "CLOSED"
                            ? "bg-gray-100"
                            : "bg-green-100"
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            selectedTicket.status === "CLOSED"
                              ? "text-gray-600"
                              : "text-green-600"
                          }`}
                        >
                          #{selectedTicket.id.slice(-3)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTicket.contact.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedTicket.contact.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          selectedTicket.status
                        )}`}
                      >
                        {getStatusIcon(selectedTicket.status)}
                        <span className="ml-1">
                          {selectedTicket.status === "OPEN"
                            ? "Aberto"
                            : selectedTicket.status === "IN_PROGRESS"
                            ? "Em Andamento"
                            : selectedTicket.status === "WAITING_CUSTOMER"
                            ? "Aguardando"
                            : "Fechado"}
                        </span>
                      </span>
                      {/* Botão Encerrar Ticket - apenas para tickets abertos */}
                      {selectedTicket.status !== "CLOSED" && (
                        <button
                          onClick={() => handleCloseTicket(selectedTicket.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Encerrar Ticket
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedTicket.status === "CLOSED" && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <XCircleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                          <span className="text-sm text-yellow-800">
                            Ticket fechado em{" "}
                            {selectedTicket.closedAt
                              ? new Date(
                                  selectedTicket.closedAt
                                ).toLocaleString("pt-BR")
                              : "N/A"}
                          </span>
                        </div>{" "}
                        <button
                          onClick={() => handleReopenTicket(selectedTicket.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Reabrir Ticket
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mensagens */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.direction === "OUTBOUND"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 max-w-xs ${
                            message.direction === "OUTBOUND"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <span
                            className={`text-xs ${
                              message.direction === "OUTBOUND"
                                ? "text-blue-200"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString(
                              "pt-BR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center text-gray-500">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhuma mensagem ainda</p>
                        <p className="text-xs text-gray-400">
                          As mensagens aparecerão aqui
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedTicket?.status === "CLOSED" && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                        <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">
                          Conversa finalizada
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input de Mensagem */}
                <div className="p-4 border-t border-gray-200">
                  {selectedTicket.status === "CLOSED" ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-3">
                        Ticket fechado. Reabra o ticket para enviar mensagens.
                      </p>
                      <button
                        onClick={() => handleReopenTicket(selectedTicket.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Reabrir Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Digite sua mensagem..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Enviar
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecione um ticket
                  </h3>
                  <p className="text-gray-500">
                    Escolha um ticket da lista para visualizar a conversa
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
