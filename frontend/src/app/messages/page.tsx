"use client";

import { useRealtimeSystem } from "@/hooks/useRealtimeSystem";
import api from "@/services/api";
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
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Importação dinâmica do emoji picker para evitar SSR issues
const Picker = dynamic(() => import("emoji-mart").then((mod) => mod.Picker), {
  ssr: false,
});

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
    initializeSocketListeners,
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
  initializeSocketListeners();

  // ===== ESTADOS =====
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Função para retornar ticket ao bot
  const handleReturnToBot = async (ticketId: string) => {
    try {
      const confirmReturn = window.confirm(
        "Tem certeza que deseja retornar este ticket para o atendimento automático?"
      );

      if (!confirmReturn) return;

      // Chamar API para mudar status de volta para OPEN
      await api.tickets.update(ticketId, { status: "OPEN" });

      // Atualizar na lista local
      useTickets.getState().updateTicketInList(ticketId, {
        status: "OPEN",
      });

      // Se for o ticket selecionado, atualizar também
      if (selectedTicket?.id === ticketId) {
        useSelectedTicket.getState().updateSelectedTicket({
          status: "OPEN",
        });
      }

      console.log("✅ Ticket retornado ao atendimento automático");
    } catch (error) {
      console.error("Erro ao retornar ticket ao bot:", error);
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
                            {/* Indicador de atendimento humano */}
                            {ticket.status === "IN_PROGRESS" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                👨 Humano
                              </span>
                            )}
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

                  {/* Status do atendimento */}
                  {selectedTicket.status === "IN_PROGRESS" && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm text-blue-800 font-medium">
                          🤖➡️👨 Transferido para atendimento humano
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        O robô não responderá automaticamente enquanto em
                        atendimento humano
                      </p>
                    </div>
                  )}
                </div>

                {/* Mensagens */}
                <div
                  className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-opacity='0.03'%3E%3Cpolygon fill='%23000' points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                >
                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      const isOutbound = message.direction === "OUTBOUND";
                      const isConsecutive =
                        index > 0 &&
                        messages[index - 1].direction === message.direction &&
                        new Date(message.createdAt).getTime() -
                          new Date(messages[index - 1].createdAt).getTime() <
                          60000; // 1 minuto

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOutbound ? "justify-end" : "justify-start"
                          } ${isConsecutive ? "mt-1" : "mt-4"}`}
                        >
                          <div
                            className={`relative max-w-xs lg:max-w-md ${
                              isOutbound
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-900 border border-gray-200"
                            } rounded-lg px-4 py-2 shadow-sm`}
                            style={{
                              borderRadius: isOutbound
                                ? isConsecutive
                                  ? "18px 18px 4px 18px"
                                  : "18px 4px 18px 18px"
                                : isConsecutive
                                ? "18px 18px 18px 4px"
                                : "4px 18px 18px 18px",
                            }}
                          >
                            {/* Conteúdo da mensagem */}
                            <div className="break-words">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>

                            {/* Timestamp e status */}
                            <div
                              className={`flex items-center justify-end mt-1 space-x-1 ${
                                isOutbound ? "text-blue-200" : "text-gray-500"
                              }`}
                            >
                              <span className="text-xs">
                                {new Date(message.createdAt).toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>

                              {/* Status da mensagem (apenas para outbound) */}
                              {isOutbound && (
                                <div className="flex">
                                  {message.status === "SENT" && (
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  {message.status === "DELIVERED" && (
                                    <div className="flex -space-x-1">
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                  {message.status === "READ" && (
                                    <div className="flex -space-x-1 text-blue-300">
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Indicador de bot */}
                            {message.isFromBot && (
                              <div
                                className={`absolute -bottom-1 ${
                                  isOutbound ? "-left-1" : "-right-1"
                                } w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center`}
                              >
                                <span className="text-xs text-white">🤖</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center text-gray-500">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhuma mensagem ainda</p>
                        <p className="text-xs text-gray-400">
                          As mensagens aparecerão aqui conforme a conversa
                          avança
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

                  {/* Indicador de digitação (para futuras implementações) */}
                  {false && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input de Mensagem */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
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
                    <div className="space-y-3">
                      {/* Área de digitação */}
                      <div className="flex items-end space-x-3">
                        <div className="flex-1 relative">
                          <textarea
                            ref={textareaRef}
                            placeholder="Digite sua mensagem..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            rows={messageText.split("\n").length || 1}
                            className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none max-h-32 bg-white"
                            style={{ minHeight: "48px" }}
                          />

                          {/* Barra de emojis e ações */}
                          <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                            {/* Emoji picker toggle */}
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Adicionar emoji"
                              onClick={() => setShowEmojiPicker((v) => !v)}
                            >
                              <span className="text-lg">�</span>
                            </button>
                            {/* Picker popup */}
                            {showEmojiPicker && (
                              <div className="absolute right-0 bottom-12 z-50">
                                <Picker
                                  theme="light"
                                  locale="pt"
                                  onEmojiSelect={(emoji: any) => {
                                    setMessageText(
                                      (prev) =>
                                        prev +
                                        (emoji.native || emoji.colons || "")
                                    );
                                    setShowEmojiPicker(false);
                                    setTimeout(() => {
                                      textareaRef.current?.focus();
                                    }, 0);
                                  }}
                                />
                              </div>
                            )}
                            {/* Contador de caracteres */}
                            {messageText.length > 0 && (
                              <span className="text-xs text-gray-400">
                                {messageText.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botão enviar */}
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim()}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                            messageText.trim()
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                        </button>
                      </div>

                      {/* Sugestões rápidas */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Olá! 👋",
                          "Obrigado! 🙏",
                          "Posso ajudar? 🤝",
                          "Vou verificar 🔍",
                          "Resolvido! ✅",
                          "Aguarde um momento ⏳",
                        ].map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setMessageText(suggestion)}
                            className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
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
