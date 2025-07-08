"use client";

import { useRealtime } from "@/hooks/useRealtime";
import { useAuthStore } from "@/store/auth";
import { useSelectedTicket, useTickets } from "@/store/tickets";
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  TicketIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

// Importação dinâmica do emoji picker para evitar SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="text-sm text-gray-500">Carregando emojis...</div>
  ),
});

export default function TicketsPage() {
  // ===== HOOKS =====
  const { user } = useAuthStore();

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

  // ===== DEBOUNCE PARA BUSCA =====
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Função debounced para atualizar o filtro de busca
  const debouncedSetSearch = useCallback(
    (value: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        setFilters({ search: value });
      }, 500); // 500ms de delay
    },
    [setFilters]
  );

  // Limpar timeout quando o componente desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const {
    selectedTicket,
    messages,
    selectTicket,
    sendMessage,
    reopenTicket: reopenSelectedTicket,
    closeTicket: closeSelectedTicket,
    loadingMessages,
    sendingMessage,
  } = useSelectedTicket();

  // Sistema unificado de tempo real
  const realtime = useRealtime();

  // ===== ESTADOS =====
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Refs para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // ===== EFEITOS =====

  // Scroll automático para a última mensagem
  const scrollToBottom = useCallback(
    (behavior: "auto" | "smooth" = "smooth") => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
      }
    },
    []
  );

  // Scroll automático quando mensagens mudam
  useEffect(() => {
    if (messages.length > 0) {
      // Usar setTimeout para garantir que o DOM foi atualizado
      setTimeout(() => scrollToBottom("smooth"), 100);
    }
  }, [messages.length, scrollToBottom]);

  // Scroll automático quando ticket é selecionado
  useEffect(() => {
    if (selectedTicket && !loadingMessages) {
      setTimeout(() => scrollToBottom("auto"), 200);
    }
  }, [selectedTicket, loadingMessages, scrollToBottom]);

  // Fechar emoji picker quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Carregar tickets ao inicializar a página
  useEffect(() => {
    console.log("🎫 Carregando tickets da API...");
    loadTickets();
  }, [loadTickets]);

  // Recarregar tickets quando os filtros mudam
  useEffect(() => {
    console.log("🔍 Filtros alterados, recarregando tickets...", filters);
    loadTickets(1); // Volta para primeira página quando filtros mudam
  }, [
    filters.status,
    filters.priority,
    filters.search,
    filters.assignedTo,
    loadTickets,
  ]);

  // Log para debug do sistema em tempo real
  useEffect(() => {
    console.log("🔄 Sistema de tempo real:", {
      isConnected: realtime.isConnected,
      isInitialized: realtime.isInitialized,
      totalSessions: realtime.totalSessions,
      connectedSessions: realtime.connectedSessions,
    });
  }, [realtime]);

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
    if (!selectedTicket || !messageText.trim() || !user || sendingMessage)
      return;

    try {
      setIsTyping(true);
      // Preparar o conteúdo da mensagem com identificação do atendente
      const attendantName = user.name || "Atendente";
      const messageContent = `**Atendente:** ${attendantName}\n${messageText.trim()}`;

      await sendMessage({
        ticketId: selectedTicket.id,
        content: messageContent,
        messageType: "TEXT",
      });

      setMessageText("");
      setShowEmojiPicker(false);

      // Focar no textarea após envio
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // Função para adicionar emoji
  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.emoji;
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);

    // Focar no textarea após adicionar emoji
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Posicionar cursor no final
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  };

  // Função para enviar com Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize do textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
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
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case "CLOSED":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <XCircleIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <TicketIcon className="w-7 h-7 mr-3 text-blue-600" />
          Tickets & Conversas
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Gerencie tickets de atendimento e conversas do WhatsApp
        </p>
      </div>

      {/* Filtros Compactos */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          {/* Busca */}
          <div className="relative min-w-64 flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                debouncedSetSearch(e.target.value);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtros */}
          <select
            value={filters.status || "ALL"}
            onChange={(e) => setFilters({ status: e.target.value as any })}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos Status</option>
            <option value="OPEN">Abertos</option>
            <option value="IN_PROGRESS">Em Progresso</option>
            <option value="CLOSED">Fechados</option>
          </select>

          <select
            value={filters.priority || "ALL"}
            onChange={(e) => setFilters({ priority: e.target.value as any })}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todas Prioridades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>

          {/* Refresh Button */}
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Tickets - Largura fixa */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              Tickets ({filteredTickets.length})
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
            ) : filteredTickets.length === 0 ? (
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
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`relative p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                    selectedTicket?.id === ticket.id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
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
                        {ticket.contact.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ticket.contact.name}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 truncate mb-1">
                        {ticket.contact.phoneNumber}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 truncate">
                          {ticket.messagingSession.name}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {new Date(ticket.lastMessageAt).toLocaleTimeString(
                            "pt-BR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>

                      {/* Indicador de mensagens não lidas */}
                      {ticket._count?.messages &&
                        ticket._count.messages > 0 && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {ticket._count.messages} mensagem
                              {ticket._count.messages !== 1 ? "s" : ""}
                            </span>
                            {ticket.status === "OPEN" && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Ações rápidas */}
                  {selectedTicket?.id === ticket.id && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center space-x-1">
                        {ticket.status === "CLOSED" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReopenTicket(ticket.id);
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
                              handleCloseTicket(ticket.id);
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

        {/* Área do Chat - Flexível */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedTicket ? (
            <>
              {/* Header do Chat - Compacto */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                        selectedTicket.status === "CLOSED"
                          ? "bg-gray-400"
                          : selectedTicket.status === "OPEN"
                          ? "bg-green-500"
                          : selectedTicket.status === "IN_PROGRESS"
                          ? "bg-blue-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {selectedTicket.contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedTicket.contact.name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <PhoneIcon className="w-3 h-3 mr-1" />
                        {selectedTicket.contact.phoneNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Status */}
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedTicket.status
                      )}`}
                    >
                      {getStatusIcon(selectedTicket.status)}
                      <span className="ml-1">
                        {selectedTicket.status === "OPEN"
                          ? "Aberto"
                          : selectedTicket.status === "IN_PROGRESS"
                          ? "Em Progresso"
                          : selectedTicket.status === "WAITING_CUSTOMER"
                          ? "Aguardando"
                          : "Fechado"}
                      </span>
                    </span>

                    {/* Ações */}
                    <div className="flex items-center space-x-1">
                      {selectedTicket.status === "CLOSED" && (
                        <button
                          onClick={() => handleReopenTicket(selectedTicket.id)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <ArrowPathIcon className="w-3 h-3 mr-1" />
                          Reabrir
                        </button>
                      )}

                      {selectedTicket.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => handleCloseTicket(selectedTicket.id)}
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

              {/* Mensagens - Scroll otimizado */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
                style={{ minHeight: 0 }}
              >
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-500">
                      Carregando mensagens...
                    </span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-center">
                    <div>
                      <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        Nenhuma mensagem ainda
                      </p>
                      <p className="text-xs text-gray-400">
                        Inicie a conversa enviando uma mensagem
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.direction === "OUTBOUND"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.direction === "OUTBOUND"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-900 border border-gray-200"
                        }`}
                      >
                        {/* Conteúdo da mensagem com parsing de markdown para atendente */}
                        <div className="text-sm">
                          {message.content.includes("**") ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: message.content
                                  .replace(
                                    /\*\*(.*?)\*\*/g,
                                    "<strong>$1</strong>"
                                  )
                                  .replace(/\n/g, "<br>"),
                              }}
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">
                              {message.content}
                            </div>
                          )}
                        </div>

                        {/* Info da mensagem */}
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`text-xs ${
                              message.direction === "OUTBOUND"
                                ? "text-blue-100"
                                : "text-gray-400"
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

                          {message.direction === "OUTBOUND" && (
                            <div className="ml-2">
                              {message.status === "SENT" && (
                                <CheckIcon className="w-3 h-3 text-blue-200" />
                              )}
                              {message.status === "DELIVERED" && (
                                <div className="flex">
                                  <CheckIcon className="w-3 h-3 text-blue-200" />
                                  <CheckIcon className="w-3 h-3 text-blue-200 -ml-1" />
                                </div>
                              )}
                              {message.status === "READ" && (
                                <div className="flex">
                                  <CheckIcon className="w-3 h-3 text-green-300" />
                                  <CheckIcon className="w-3 h-3 text-green-300 -ml-1" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Indicador de digitação */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Referência para scroll automático */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensagem - Melhorado */}
              {selectedTicket.status !== "CLOSED" && (
                <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
                  <div className="flex items-end space-x-3">
                    {/* Emoji Picker */}
                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Adicionar emoji"
                      >
                        <FaceSmileIcon className="w-5 h-5" />
                      </button>

                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 z-50">
                          <EmojiPicker
                            onEmojiClick={handleEmojiSelect}
                            height={300}
                            width={280}
                            searchDisabled={false}
                            skinTonesDisabled={true}
                            previewConfig={{ showPreview: false }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Campo de texto */}
                    <div className="flex-1">
                      <textarea
                        ref={textareaRef}
                        value={messageText}
                        onChange={handleTextareaChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua mensagem..."
                        rows={1}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                        style={{ minHeight: "44px", maxHeight: "120px" }}
                        disabled={sendingMessage}
                      />
                    </div>

                    {/* Botão de envio */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendingMessage}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Enviar mensagem"
                    >
                      {sendingMessage ? (
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <PaperAirplaneIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Informações do chat */}
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      {realtime.isConnected ? (
                        <span className="text-green-600">
                          ● Conectado em tempo real
                        </span>
                      ) : (
                        <span className="text-red-600">
                          ● Desconectado -{" "}
                          {realtime.error || "Verificando conexão..."}
                        </span>
                      )}
                    </span>
                    <span>Enter para enviar, Shift+Enter para nova linha</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Estado vazio - Melhorado
            <div className="flex-1 flex items-center justify-center text-center bg-gray-50">
              <div className="max-w-md p-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um ticket
                </h3>
                <p className="text-gray-500 mb-6">
                  Escolha um ticket da lista para iniciar ou continuar a
                  conversa
                </p>

                {/* Status do sistema */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-left">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Status do Sistema
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tempo real:</span>
                      <span
                        className={`font-medium flex items-center ${
                          realtime.isConnected
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            realtime.isConnected ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        {realtime.isConnected ? "Conectado" : "Desconectado"}
                        {!realtime.isConnected && realtime.error && (
                          <span className="ml-1 text-xs">
                            ({realtime.error})
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sessões ativas:</span>
                      <span className="font-medium text-blue-600">
                        {realtime.connectedSessions}/{realtime.totalSessions}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total de tickets:</span>
                      <span className="font-medium text-gray-900">
                        {filteredTickets.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tickets abertos:</span>
                      <span className="font-medium text-green-600">
                        {
                          filteredTickets.filter((t) => t.status === "OPEN")
                            .length
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Em progresso:</span>
                      <span className="font-medium text-blue-600">
                        {
                          filteredTickets.filter(
                            (t) => t.status === "IN_PROGRESS"
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
