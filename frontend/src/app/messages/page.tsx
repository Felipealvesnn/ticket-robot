"use client";

import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";
import { useSelectedTicket, useTickets } from "@/store/tickets";
import { TicketIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { useGesture } from "react-use-gesture";

// Importar os novos componentes
import ChatHeader from "@/app/messages/components/chat/ChatHeader";
import ChatInfo from "@/app/messages/components/chat/ChatInfo";
import ChatInput from "@/app/messages/components/chat/ChatInput";
import ChatMessages from "@/app/messages/components/chat/ChatMessages";
import FilePreviewModal from "@/app/messages/components/FilePreviewModal";
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
  const {
    isConnected,
    isConnecting,
    error: socketError,
    joinTicket,
    leaveTicket,
  } = useSocket();

  // ===== ESTADOS =====
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

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

  // Estado melhorado para drag & drop
  const [dragState, setDragState] = useState({
    isDragging: false,
    isOver: false,
    canDrop: false,
  });

  // Usar useGesture para melhorar drag & drop e experiência de toque
  const gestureBinds = useGesture(
    {
      // Gestos de arrastar para toque/mobile
      onDrag: ({ active, movement: [mx, my], velocity, event }) => {
        // Detectar gestos de arrastar para melhorar UX mobile
        if (active && velocity > 0.5) {
          setDragState((prev) => ({
            ...prev,
            isDragging: true,
            isOver: Math.abs(mx) > 50 || Math.abs(my) > 50,
          }));
        } else if (!active) {
          setDragState((prev) => ({ ...prev, isDragging: false }));
        }
      },

      // Prevenir zoom durante drag & drop
      onPinch: ({ active, offset: [scale] }) => {
        if (active && dragState.isOver) {
          return false;
        }
      },

      // 🔥 NOVO: Gestos de hover/proximidade para drag & drop
      onHover: ({ hovering, event }) => {
        if (hovering && event && "dataTransfer" in event) {
          // Detectar quando arquivo está sendo arrastado sobre a área
          const dragEvent = event as DragEvent;
          if (dragEvent.dataTransfer?.types.includes("Files")) {
            setDragState((prev) => ({
              ...prev,
              isOver: true,
              canDrop: !!selectedTicket,
            }));
          }
        } else if (!hovering) {
          setDragState((prev) => ({
            ...prev,
            isOver: false,
            isDragging: false,
          }));
        }
      },

      // 🔥 NOVO: Gestos de movimento do mouse para feedback visual
      onMove: ({ movement: [mx, my], dragging, event }) => {
        if (dragging && event && "dataTransfer" in event) {
          // Feedback visual baseado na posição do mouse durante drag
          const intensity = Math.min(Math.sqrt(mx * mx + my * my) / 100, 1);
          setDragState((prev) => ({
            ...prev,
            isDragging: true,
            isOver: intensity > 0.3,
          }));
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        threshold: 10,
      },
      pinch: {
        rubberband: true,
      },
      // 🔥 NOVO: Configurações para melhor detecção de hover
      hover: {
        enabled: true,
      },
      move: {
        enabled: true,
      },
    }
  );

  // Funções melhoradas para drag & drop nativo (em conjunto com useGesture)
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!selectedTicket) {
        setError("Selecione um ticket antes de enviar arquivos");
        return;
      }

      // 🔥 MELHORADO: Feedback mais detalhado baseado no tipo de arquivo
      const files = e.dataTransfer.files;
      const items = e.dataTransfer.items;

      let fileTypes: string[] = [];
      if (files.length > 0) {
        fileTypes = Array.from(files).map((file) => file.type);
      } else if (items.length > 0) {
        fileTypes = Array.from(items).map((item) => item.type);
      }

      const hasValidFiles = fileTypes.some(
        (type) =>
          type.startsWith("image/") ||
          type.startsWith("video/") ||
          type.startsWith("application/") ||
          type === "" // Para arquivos sem tipo específico
      );

      setDragState((prev) => ({
        ...prev,
        isOver: true,
        canDrop: !!selectedTicket && hasValidFiles,
        isDragging: true,
      }));
    },
    [selectedTicket]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 🔥 MELHORADO: Detecção mais precisa de arquivos
      const hasFiles = e.dataTransfer.types.includes("Files");
      const hasItems = e.dataTransfer.items.length > 0;

      if ((hasFiles || hasItems) && selectedTicket) {
        setDragState((prev) => ({
          ...prev,
          canDrop: true,
          isDragging: true,
        }));
      }
    },
    [selectedTicket]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 🔥 MELHORADO: Detecção mais precisa de saída da área
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    // Também verificar se o target relacionado está fora do container
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isRelatedOutside =
      relatedTarget && !e.currentTarget.contains(relatedTarget);

    if (isOutside || isRelatedOutside) {
      setDragState((prev) => ({
        ...prev,
        isOver: false,
        isDragging: false,
      }));
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDragState({ isDragging: false, isOver: false, canDrop: false });

      // Verificar se há um ticket selecionado antes de processar arquivos
      if (!selectedTicket) {
        console.warn("Nenhum ticket selecionado para envio de arquivo");
        setError("Selecione um ticket antes de enviar arquivos");
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];

        // Verificar tamanho do arquivo (máximo 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          setError("Arquivo muito grande! Máximo 10MB.");
          return;
        }

        console.log("📁 Arquivo arrastado:", {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          ticketId: selectedTicket.id,
        });

        // Feedback visual de sucesso
        setDragState({ isDragging: false, isOver: false, canDrop: true });
        setTimeout(() => {
          setDragState((prev) => ({ ...prev, canDrop: false }));
        }, 500);

        // Mostrar preview do arquivo
        setPreviewFile(file);
      }
    },
    [selectedTicket]
  );

  const getFileType = (file: File): "IMAGE" | "VIDEO" | "DOCUMENT" => {
    if (file.type.startsWith("image/")) return "IMAGE";
    if (file.type.startsWith("video/")) return "VIDEO";
    return "DOCUMENT";
  };

  // Função para confirmar envio de arquivo via drag & drop
  const confirmFileSend = useCallback(async () => {
    if (!previewFile || !selectedTicket) return;

    const messageType = getFileType(previewFile);

    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      await sendMessage({
        ticketId: selectedTicket.id,
        content: messageText.trim() || "",
        messageType,
        file: previewFile,
      });

      setMessageText("");
      setUploadProgress(0);
      setPreviewFile(null);
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      setError("Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  }, [previewFile, selectedTicket, sendMessage, messageText]);

  // Função para upload de arquivo
  const handleFileUpload = useCallback(
    async (file: File, messageType: "IMAGE" | "VIDEO" | "DOCUMENT") => {
      if (!selectedTicket || !user || sendingMessage) {
        console.warn("Upload cancelado:", {
          hasSelectedTicket: !!selectedTicket,
          hasUser: !!user,
          sendingMessage,
        });
        return;
      }

      try {
        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        console.log("📎 Enviando arquivo:", {
          fileName: file.name,
          fileType: file.type,
          messageType,
          ticketId: selectedTicket.id,
        });

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

      {/* Modal de preview de arquivo */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onConfirm={confirmFileSend}
        isUploading={isUploading}
      />

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
                dragOver={dragState.isOver}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                gestureBinds={gestureBinds}
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
