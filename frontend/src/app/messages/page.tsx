"use client";

import { useAuthStore } from "@/store/auth";
import { useSelectedTicket, useTickets } from "@/store/tickets";
import { TicketIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

// Importar os novos componentes
import ChatHeader from "@/app/messages/components/chat/ChatHeader";
import ChatInfo from "@/app/messages/components/chat/ChatInfo";
import ChatInput from "@/app/messages/components/chat/ChatInput";
import ChatMessages from "@/app/messages/components/chat/ChatMessages";
import ErrorNotification from "@/components/common/ErrorNotification";
import EmptyState from "@/components/tickets/EmptyState";
import Pagination from "@/components/tickets/Pagination";
import TicketFilters from "@/components/tickets/TicketFilters";
import TicketList from "@/components/tickets/TicketList";

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
    loadingMessages,
    sendingMessage,
  } = useSelectedTicket();

  // ===== SOCKET SIMPLIFICADO =====
  const { isConnected, isConnecting, error: socketError, joinTicket, leaveTicket } = useSocket();

  // ===== ESTADOS =====
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== EFEITOS =====

  // Auto-clear de erros
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  // ===== FUNÇÕES DE MÍDIA =====

  // Função para lidar com drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      handleFileUpload(file, getFileType(file));
    }
  }, []);

  const getFileType = (file: File): "IMAGE" | "VIDEO" | "DOCUMENT" => {
    if (file.type.startsWith("image/")) return "IMAGE";
    if (file.type.startsWith("video/")) return "VIDEO";
    return "DOCUMENT";
  };

  // Função para upload de arquivo
  const handleFileUpload = useCallback(
    async (file: File, messageType: "IMAGE" | "VIDEO" | "DOCUMENT") => {
      if (!selectedTicket || !user || sendingMessage) return;

      try {
        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        await sendMessage({
          ticketId: selectedTicket.id,
          content: messageText.trim() || "",
          messageType,
          file,
        });

        setMessageText("");
        setUploadProgress(0);
      } catch (error) {
        console.error("Erro ao enviar arquivo:", error);
        setError("Erro ao enviar arquivo. Tente novamente.");
      } finally {
        setIsUploading(false);
      }
    },
    [selectedTicket, user, sendingMessage, sendMessage, messageText]
  );

  // ===== FUNÇÕES DE INTERAÇÃO =====

  // Função para reabrir ticket
  const handleReopenTicket = useCallback(
    async (ticketId: string) => {
      try {
        setError(null);
        if (selectedTicket?.id === ticketId) {
          await reopenSelectedTicket(ticketId, "Reaberto pelo atendente");
        } else {
          await reopenTicketAction(ticketId, "Reaberto pelo atendente");
        }
      } catch (error) {
        console.error("Erro ao reabrir ticket:", error);
        setError("Erro ao reabrir ticket. Tente novamente.");
      }
    },
    [selectedTicket, reopenSelectedTicket, reopenTicketAction]
  );

  // Função para fechar ticket
  const handleCloseTicket = useCallback(
    async (ticketId: string) => {
      try {
        const confirmClose = window.confirm(
          "Tem certeza que deseja encerrar este ticket?"
        );

        if (!confirmClose) return;

        setError(null);
        await closeSelectedTicket(ticketId, "Encerrado pelo atendente");
      } catch (error) {
        console.error("Erro ao encerrar ticket:", error);
        setError("Erro ao encerrar ticket. Tente novamente.");
      }
    },
    [closeSelectedTicket]
  );

  // Função para enviar mensagem
  const handleSendMessage = useCallback(async () => {
    if (!selectedTicket || !messageText.trim() || !user || sendingMessage)
      return;

    try {
      setError(null);
      setIsTyping(true);

      // Preparar o conteúdo da mensagem com identificação do atendente
      const attendantName = user.name || "Atendente";
      const messageContent = `*${attendantName}:*\n${messageText.trim()}`;

      await sendMessage({
        ticketId: selectedTicket.id,
        content: messageContent,
      });

      setMessageText("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setError("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsTyping(false);
    }
  }, [selectedTicket, messageText, user, sendingMessage, sendMessage]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Notificação de erro */}
      <ErrorNotification error={error} onClose={() => setError(null)} />

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

      {/* Filtros */}
      <TicketFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refreshTickets}
        loading={loading}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Tickets */}
        <div className="flex flex-col">
          <TicketList
            tickets={tickets}
            selectedTicketId={selectedTicket?.id || null}
            loading={loading}
            onSelectTicket={selectTicket}
            onReopenTicket={handleReopenTicket}
            onCloseTicket={handleCloseTicket}
          />

          {/* Paginação */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Área do Chat */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedTicket ? (
            <>
              {/* Header do Chat */}
              <ChatHeader
                ticket={selectedTicket}
                onReopenTicket={handleReopenTicket}
                onCloseTicket={handleCloseTicket}
              />

              {/* Mensagens */}
              <ChatMessages
                messages={messages}
                isLoading={loadingMessages}
                isTyping={isTyping}
                dragOver={dragOver}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />

              {/* Input de mensagem */}
              {selectedTicket.status !== "CLOSED" && (
                <div>
                  <ChatInput
                    messageText={messageText}
                    setMessageText={setMessageText}
                    onSendMessage={handleSendMessage}
                    onFileUpload={handleFileUpload}
                    disabled={sendingMessage || isUploading}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                  />
                  <ChatInfo
                    messagesCount={messages.length}
                    isUploading={isUploading}
                  />
                </div>
              )}
            </>
          ) : (
            <EmptyState tickets={tickets} />
          )}
        </div>
      </div>
    </div>
  );
}
