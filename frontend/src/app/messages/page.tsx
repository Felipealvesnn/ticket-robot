"use client";

import React, { useCallback, useEffect, useState } from "react";
// ❌ REMOVIDO: import { useSocket } from "@/hooks/useSocket"; - já gerenciado pelo SocketProvider
import { useAuthStore } from "@/store/auth";
import { useSelectedTicket, useTickets } from "@/store/tickets";
import {
  ExclamationTriangleIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
// ❌ REMOVIDO: Imports duplicados
import { confirmAlert } from "react-confirm-alert";
import { useHotkeys } from "react-hotkeys-hook";

// Importar os novos componentes
import ChatHeader from "@/app/messages/components/chat/ChatHeader";
import ChatInfo from "@/app/messages/components/chat/ChatInfo";
import ChatInput from "@/app/messages/components/chat/ChatInput";
import ChatMessages from "@/app/messages/components/chat/ChatMessages";
import FilePreviewModal from "@/app/messages/components/FilePreviewModal";
import Pagination from "@/app/messages/components/tickets/Pagination";
import TicketFilters from "@/app/messages/components/tickets/TicketFilters";
import TicketList from "@/app/messages/components/tickets/TicketList";
import ErrorNotification from "@/components/common/ErrorNotification";

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

  // ❌ REMOVIDO: Duplicação do useSocket - já gerenciado pelo SocketProvider
  // const { isConnected, isConnecting, error: socketError, joinTicket, leaveTicket } = useSocket();

  // ✅ Para compatibilidade visual, usar valores estáticos por enquanto
  const isConnected = true; // TODO: Pegar do SocketProvider se necessário
  const isConnecting = false;
  const socketError = null;
  const joinTicket = () => {}; // Função vazia
  const leaveTicket = () => {}; // Função vazia

  // ===== ESTADOS =====
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [showHotkeyHelper, setShowHotkeyHelper] = useState(false);

  // Estado para drag & drop
  const [dragState, setDragState] = useState({
    isDragging: false,
    isOver: false,
    canDrop: false,
  });

  // Placeholder para gestureBinds
  const gestureBinds = {};

  // ===== EFEITOS =====
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadTickets(1);
  }, [
    filters.status,
    filters.priority,
    filters.search,
    filters.assignedTo,
    loadTickets,
  ]);

  // ===== ATALHOS DE TECLADO =====
  useHotkeys(
    "ctrl+/, cmd+/, shift+?",
    (e) => {
      e.preventDefault();
      setShowHotkeyHelper((prev) => !prev);
    },
    {},
    []
  );

  useHotkeys(
    "ctrl+enter, cmd+enter",
    (e) => {
      if (selectedTicket && messageText.trim()) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    {
      enableOnFormTags: ["input", "textarea"],
      enabled: !!(selectedTicket && messageText.trim() && !sendingMessage),
    },
    [selectedTicket, messageText, sendingMessage]
  );

  useHotkeys(
    "j, arrowdown",
    (e) => {
      e.preventDefault();
      if (tickets.length > 0) {
        const currentIndex = selectedTicket
          ? tickets.findIndex((t) => t.id === selectedTicket.id)
          : -1;
        const nextIndex =
          currentIndex < tickets.length - 1 ? currentIndex + 1 : 0;
        if (tickets[nextIndex]) {
          selectTicket(tickets[nextIndex]);
        }
      }
    },
    { enabled: tickets.length > 0 },
    [tickets, selectedTicket, selectTicket]
  );

  useHotkeys(
    "k, arrowup",
    (e) => {
      e.preventDefault();
      if (tickets.length > 0) {
        const currentIndex = selectedTicket
          ? tickets.findIndex((t) => t.id === selectedTicket.id)
          : 0;
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : tickets.length - 1;
        if (tickets[prevIndex]) {
          selectTicket(tickets[prevIndex]);
        }
      }
    },
    { enabled: tickets.length > 0 },
    [tickets, selectedTicket, selectTicket]
  );

  useHotkeys(
    "ctrl+r, cmd+r, f5",
    (e) => {
      e.preventDefault();
      refreshTickets();
    },
    {},
    [refreshTickets]
  );

  useHotkeys(
    "ctrl+shift+c, cmd+shift+c",
    (e) => {
      if (selectedTicket && selectedTicket.status !== "CLOSED") {
        e.preventDefault();
        handleCloseTicket(selectedTicket.id);
      }
    },
    { enabled: !!(selectedTicket && selectedTicket.status !== "CLOSED") },
    [selectedTicket]
  );

  useHotkeys(
    "ctrl+shift+o, cmd+shift+o",
    (e) => {
      if (selectedTicket && selectedTicket.status === "CLOSED") {
        e.preventDefault();
        handleReopenTicket(selectedTicket.id);
      }
    },
    { enabled: !!(selectedTicket && selectedTicket.status === "CLOSED") },
    [selectedTicket]
  );

  // ===== FUNÇÕES DE DRAG & DROP =====
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!selectedTicket) {
        setError("Selecione um ticket antes de enviar arquivos");
        return;
      }

      setDragState((prev) => ({
        ...prev,
        isOver: true,
        canDrop: !!selectedTicket,
        isDragging: true,
      }));
    },
    [selectedTicket]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const hasFiles = e.dataTransfer.types.includes("Files");
      if (hasFiles && selectedTicket) {
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

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    if (isOutside) {
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

      if (!selectedTicket) {
        setError("Selecione um ticket antes de enviar arquivos");
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          setError("Arquivo muito grande! Máximo 10MB.");
          return;
        }
        setPreviewFile(file);
      }
    },
    [selectedTicket]
  );

  // ===== FUNÇÕES DE INTERAÇÃO =====
  const getFileType = (file: File): "IMAGE" | "VIDEO" | "DOCUMENT" => {
    if (file.type.startsWith("image/")) return "IMAGE";
    if (file.type.startsWith("video/")) return "VIDEO";
    return "DOCUMENT";
  };

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

  const handleCloseTicket = useCallback(
    async (ticketId: string) => {
      try {
        confirmAlert({
          customUI: ({ onClose }) => {
            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Encerrar ticket
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Tem certeza que deseja encerrar este ticket?
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3 justify-end">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        onClose();
                        setError(null);
                        await closeSelectedTicket(
                          ticketId,
                          "Encerrado pelo atendente"
                        );
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                    >
                      Encerrar
                    </button>
                  </div>
                </div>
              </div>
            );
          },
        });
      } catch (error) {
        console.error("Erro ao encerrar ticket:", error);
        setError("Erro ao encerrar ticket. Tente novamente.");
      }
    },
    [closeSelectedTicket]
  );

  const handleSendMessage = useCallback(async () => {
    if (!selectedTicket || !messageText.trim() || !user || sendingMessage)
      return;

    try {
      setError(null);
      setIsTyping(true);

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

      {/* Modal de ajuda dos atalhos */}
      {showHotkeyHelper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Atalhos de Teclado
              </h3>
              <button
                onClick={() => setShowHotkeyHelper(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span>Enviar mensagem</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">
                  Ctrl + Enter
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Próximo ticket</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">J ou ↓</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Ticket anterior</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">K ou ↑</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Recarregar tickets</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + R</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Fechar ticket</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">
                  Ctrl + Shift + C
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Reabrir ticket</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">
                  Ctrl + Shift + O
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Mostrar atalhos</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + /</kbd>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHotkeyHelper(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <TicketIcon className="w-7 h-7 mr-3 text-blue-600" />
              Tickets & Conversas
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Gerencie tickets de atendimento e conversas do WhatsApp
            </p>
          </div>

          {/* Status de conexão e atalhos */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">Ctrl+Enter</span>
              <span>Enviar</span>
              <span className="text-gray-300">|</span>
              <span className="px-2 py-1 bg-gray-100 rounded">J/K</span>
              <span>Navegar</span>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowHotkeyHelper(true)}
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="Ver todos os atalhos (Ctrl + /)"
              >
                ?
              </button>
            </div>

            <button
              onClick={() => setShowHotkeyHelper(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Atalhos de teclado"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span
                className={`text-sm font-medium ${
                  isConnected ? "text-green-700" : "text-red-700"
                }`}
              >
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>
        </div>
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
        <div className="w-full lg:w-80 xl:w-96 flex flex-col border-r border-gray-200 bg-white">
          <div className="flex-1 overflow-y-auto">
            <TicketList
              tickets={tickets}
              selectedTicketId={selectedTicket?.id || null}
              loading={loading}
              onSelectTicket={selectTicket}
              onReopenTicket={handleReopenTicket}
              onCloseTicket={handleCloseTicket}
            />
          </div>

          {/* Paginação */}
          <div className="border-t border-gray-100 p-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>

        {/* Área do Chat */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Header do Chat - Altura fixa */}
              <div className="flex-shrink-0">
                <ChatHeader
                  ticket={selectedTicket}
                  onReopenTicket={handleReopenTicket}
                  onCloseTicket={handleCloseTicket}
                />
              </div>

              {/* Mensagens - Área flexível */}
              <div className="flex-1 overflow-hidden">
                <ChatMessages
                  messages={messages}
                  isLoading={loadingMessages}
                  isTyping={isTyping}
                  dragOver={dragState.isOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  gestureBinds={gestureBinds}
                  contactName={selectedTicket?.contact?.name}
                />
              </div>

              {/* Input de mensagem - Altura fixa */}
              {selectedTicket.status !== "CLOSED" && (
                <div className="flex-shrink-0">
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
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Selecione um ticket para iniciar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
