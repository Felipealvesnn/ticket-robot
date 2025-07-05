"use client";

import {
  BellIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Nova mensagem recebida",
      message: "Você recebeu uma nova mensagem de João Silva",
      type: "info",
      isRead: false,
      createdAt: "2025-01-04T10:30:00Z",
      actionUrl: "/messages",
    },
    {
      id: "2",
      title: "Sessão WhatsApp desconectada",
      message:
        "A sessão do WhatsApp foi desconectada. Reconecte para continuar recebendo mensagens.",
      type: "warning",
      isRead: false,
      createdAt: "2025-01-04T09:15:00Z",
      actionUrl: "/sessions",
    },
    {
      id: "3",
      title: "Usuário adicionado com sucesso",
      message: "O usuário Maria Santos foi adicionado à empresa com sucesso.",
      type: "success",
      isRead: true,
      createdAt: "2025-01-04T08:45:00Z",
    },
    {
      id: "4",
      title: "Erro no sistema",
      message:
        "Ocorreu um erro no processamento de mensagens. Verifique os logs.",
      type: "error",
      isRead: false,
      createdAt: "2025-01-04T08:00:00Z",
    },
  ]);

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckIcon className="w-5 h-5 text-green-600" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case "error":
        return <XMarkIcon className="w-5 h-5 text-red-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string, isRead: boolean) => {
    const baseClass = isRead ? "bg-gray-50" : "bg-white border-l-4";

    if (!isRead) {
      switch (type) {
        case "success":
          return `${baseClass} border-green-500`;
        case "warning":
          return `${baseClass} border-yellow-500`;
        case "error":
          return `${baseClass} border-red-500`;
        default:
          return `${baseClass} border-blue-500`;
      }
    }

    return baseClass;
  };

  const filteredNotifications = notifications.filter((notif) => {
    switch (filter) {
      case "unread":
        return !notif.isRead;
      case "read":
        return notif.isRead;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BellIcon className="w-8 h-8 mr-3 text-blue-600" />
                Notificações
                {unreadCount > 0 && (
                  <span className="ml-3 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                Acompanhe todas as notificações do sistema
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Marcar todas como lidas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <TrashIcon className="w-5 h-5 mr-2" />
                  Limpar todas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Filtrar:
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Todas ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === "unread"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Não lidas ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter("read")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === "read"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Lidas ({notifications.length - unreadCount})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {filter === "all"
                  ? "Nenhuma notificação encontrada"
                  : filter === "unread"
                  ? "Nenhuma notificação não lida"
                  : "Nenhuma notificação lida"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg shadow p-6 transition-all duration-200 ${getNotificationBg(
                  notification.type,
                  notification.isRead
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${
                          notification.isRead
                            ? "text-gray-700"
                            : "text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p
                        className={`mt-1 ${
                          notification.isRead
                            ? "text-gray-500"
                            : "text-gray-700"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                      {notification.actionUrl && (
                        <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Ver detalhes →
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Marcar como lida"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir notificação"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
