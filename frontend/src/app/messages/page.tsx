"use client";

import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";
import { useSelectedTicket, useTickets } from "@/store/tickets";
import {
  ExclamationTriangleIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { useHotkeys } from "react-hotkeys-hook";
// import { useGesture } from "react-use-gesture"; // Comentado temporariamente

// Importar os novos componentes
import ChatHeader from "@/app/messages/components/chat/ChatHeader";
import ChatInfo from "@/app/messages/components/chat/ChatInfo";
import ChatInput from "@/app/messages/components/chat/ChatInput";
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
  const [showHotkeyHelper, setShowHotkeyHelper] = useState(false);

  // Atalho para mostrar/ocultar helper de atalhos
  useHotkeys(
    "ctrl+/, cmd+/, shift+?",
    (e) => {
      e.preventDefault();
      setShowHotkeyHelper((prev) => !prev);
    },
    {},
    []
  );

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

  // useGesture temporariamente comentado para debug
  /*
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
  */

  // Placeholder temporário para gestureBinds
  const gestureBinds = {};

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
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

  // Atalhos de teclado para melhor UX usando react-hotkeys-hook
  useHotkeys(
    "ctrl+enter, cmd+enter",
    (e) => {
      if (selectedTicket && messageText.trim()) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    {
      enableOnFormTags: ["input", "textarea"], // Permitir em campos de formulário
      enabled: !!(selectedTicket && messageText.trim() && !sendingMessage),
    },
    [selectedTicket, messageText, sendingMessage, handleSendMessage]
  );

  // Atalho ESC para ações rápidas
  useHotkeys(
    "escape",
    (e) => {
      if (selectedTicket) {
        // Implementar lógica para limpar seleção se necessário
        console.log("ESC pressed - could clear selection or close modals");
      }
    },
    {
      enabled: !!selectedTicket,
    },
    [selectedTicket]
  );

  // Atalhos para navegação rápida de tickets
  useHotkeys(
    "j, arrowdown",
    (e) => {
      e.preventDefault();
      // Navegar para próximo ticket
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
    {
      enabled: tickets.length > 0,
    },
    [tickets, selectedTicket, selectTicket]
  );

  useHotkeys(
    "k, arrowup",
    (e) => {
      e.preventDefault();
      // Navegar para ticket anterior
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
    {
      enabled: tickets.length > 0,
    },
    [tickets, selectedTicket, selectTicket]
  );

  // Atalho para recarregar tickets
  useHotkeys(
    "ctrl+r, cmd+r, f5",
    (e) => {
      e.preventDefault();
      refreshTickets();
    },
    {},
    [refreshTickets]
  );

  // Atalho para focar no campo de busca
  useHotkeys(
    "ctrl+f, cmd+f, /",
    (e) => {
      e.preventDefault();
      // TODO: Focar no campo de busca de tickets
      console.log("Focus search field");
    },
    {},
    []
  );

  // Atalho para fechar ticket atual
  useHotkeys(
    "ctrl+shift+c, cmd+shift+c",
    (e) => {
      if (selectedTicket && selectedTicket.status !== "CLOSED") {
        e.preventDefault();
        handleCloseTicket(selectedTicket.id);
      }
    },
    {
      enabled: !!(selectedTicket && selectedTicket.status !== "CLOSED"),
    },
    [selectedTicket, handleCloseTicket]
  );

  // Atalho para reabrir ticket atual
  useHotkeys(
    "ctrl+shift+o, cmd+shift+o",
    (e) => {
      if (selectedTicket && selectedTicket.status === "CLOSED") {
        e.preventDefault();
        handleReopenTicket(selectedTicket.id);
      }
    },
    {
      enabled: !!(selectedTicket && selectedTicket.status === "CLOSED"),
    },
    [selectedTicket, handleReopenTicket]
  );

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
            {/* Atalhos rápidos - Info */}
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

            {/* Botão de ajuda para mobile */}
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

            {/* Status de conexão */}
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
          <TicketList
            tickets={tickets}
            selectedTicketId={selectedTicket?.id || null}
            loading={loading}
            onSelectTicket={selectTicket}
            onReopenTicket={handleReopenTicket}
            onCloseTicket={handleCloseTicket}
          />

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
        <div className="flex-1 flex flex-col bg-white">
          {selectedTicket ? (
            <>
              {/* Header do Chat */}
              <ChatHeader
                ticket={selectedTicket}
                onReopenTicket={handleReopenTicket}
                onCloseTicket={handleCloseTicket}
              />

              {/* Mensagens - Versão melhorada */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-gray-500">Carregando mensagens...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message, index) => {
                      const showDate =
                        index === 0 ||
                        new Date(message.createdAt).toDateString() !==
                          new Date(
                            messages[index - 1].createdAt
                          ).toDateString();

                      return (
                        <div key={message.id || index}>
                          {/* Separador de data */}
                          {showDate && (
                            <div className="flex items-center justify-center my-4">
                              <div className="bg-white px-4 py-1 rounded-full shadow-sm border text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </div>
                            </div>
                          )}

                          {/* Mensagem */}
                          <div
                            className={`flex ${
                              message.isMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md ${
                                message.isMe ? "order-2" : "order-1"
                              }`}
                            >
                              <div
                                className={`px-4 py-3 rounded-2xl shadow-sm ${
                                  message.isMe
                                    ? "bg-blue-500 text-white rounded-br-md"
                                    : "bg-white text-gray-900 rounded-bl-md border"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>

                                {/* Status e hora */}
                                <div
                                  className={`flex items-center justify-end mt-2 space-x-1 text-xs ${
                                    message.isMe
                                      ? "text-blue-100"
                                      : "text-gray-500"
                                  }`}
                                >
                                  <span>
                                    {new Date(
                                      message.createdAt
                                    ).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>

                                  {/* Indicadores de status para mensagens enviadas */}
                                  {message.isMe && (
                                    <div className="flex">
                                      {message.status === "SENT" && (
                                        <svg
                                          className="w-4 h-4"
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
                                        <svg
                                          className="w-4 h-4"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                          <path
                                            fillRule="evenodd"
                                            d="M12.707 5.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                      {message.status === "READ" && (
                                        <svg
                                          className="w-4 h-4 text-blue-200"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                          <path
                                            fillRule="evenodd"
                                            d="M12.707 5.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Avatar do contato */}
                            {!message.isMe && (
                              <div className="order-1 mr-3 mt-auto">
                                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold">
                                  {selectedTicket?.contact?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhuma mensagem ainda
                      </h3>
                      <p className="text-gray-500 max-w-sm">
                        Esta conversa ainda não possui mensagens. Quando o
                        cliente enviar uma mensagem, ela aparecerá aqui.
                      </p>
                    </div>
                  )}

                  {/* Indicador de digitação */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 rounded-2xl px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Selecione um ticket para iniciar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
