"use client";

import {
  AlertTriangle,
  Bell,
  Mail,
  MessageSquare,
  Volume2,
} from "lucide-react";
import { useState } from "react";

interface NotificationSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function NotificationSettings({
  onUnsavedChanges,
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newMessages: true,
    sessionAlerts: true,
    systemUpdates: false,
    marketingEmails: false,
    soundEnabled: true,
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "08:00",
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    onUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="text-blue-600" size={20} />
          <h3 className="font-medium text-blue-900">
            Preferências de Notificação
          </h3>
        </div>
        <p className="text-blue-800 text-sm">
          Configure como você deseja receber notificações sobre atividades do
          sistema.
        </p>
      </div>

      {/* Tipos de Notificação */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Tipos de Notificação
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="text-blue-500" size={20} />
              <div>
                <h4 className="font-medium text-gray-900">
                  Notificações por Email
                </h4>
                <p className="text-sm text-gray-600">
                  Receber alertas importantes por email
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleSettingChange(
                  "emailNotifications",
                  !settings.emailNotifications
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="text-green-500" size={20} />
              <div>
                <h4 className="font-medium text-gray-900">Notificações Push</h4>
                <p className="text-sm text-gray-600">
                  Alertas em tempo real no navegador
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleSettingChange(
                  "pushNotifications",
                  !settings.pushNotifications
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.pushNotifications ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.pushNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Eventos Específicos */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Eventos Específicos
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-blue-500" size={20} />
              <div>
                <h4 className="font-medium text-gray-900">Novas Mensagens</h4>
                <p className="text-sm text-gray-600">
                  Quando uma nova mensagem chegar
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleSettingChange("newMessages", !settings.newMessages)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.newMessages ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.newMessages ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-yellow-500" size={20} />
              <div>
                <h4 className="font-medium text-gray-900">Alertas de Sessão</h4>
                <p className="text-sm text-gray-600">
                  Problemas de conexão ou desconexões
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleSettingChange("sessionAlerts", !settings.sessionAlerts)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.sessionAlerts ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.sessionAlerts ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Volume2 className="text-purple-500" size={20} />
              <div>
                <h4 className="font-medium text-gray-900">
                  Som das Notificações
                </h4>
                <p className="text-sm text-gray-600">
                  Reproduzir som ao receber notificações
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleSettingChange("soundEnabled", !settings.soundEnabled)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.soundEnabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Horário Silencioso */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Horário Silencioso
        </h3>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-gray-900">
                Ativar Horário Silencioso
              </h4>
              <p className="text-sm text-gray-600">
                Não receber notificações durante este período
              </p>
            </div>
            <button
              onClick={() =>
                handleSettingChange("quietHours", !settings.quietHours)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.quietHours ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.quietHours ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {settings.quietHours && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Início
                </label>
                <input
                  type="time"
                  value={settings.quietStart}
                  onChange={(e) =>
                    handleSettingChange("quietStart", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fim
                </label>
                <input
                  type="time"
                  value={settings.quietEnd}
                  onChange={(e) =>
                    handleSettingChange("quietEnd", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
