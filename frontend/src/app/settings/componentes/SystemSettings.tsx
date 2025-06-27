"use client";

import { Database, Settings, Zap } from "lucide-react";
import { useState } from "react";

interface SystemSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function SystemSettings({
  onUnsavedChanges,
}: SystemSettingsProps) {
  const [settings, setSettings] = useState({
    autoReconnect: true,
    messageRetention: "30",
    maxConcurrentSessions: "5",
    apiTimeout: "30",
    enableLogging: true,
    logLevel: "info",
    backupEnabled: true,
    backupFrequency: "daily",
  });

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    onUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="text-gray-600" size={20} />
          <h3 className="font-medium text-gray-900">
            Configurações do Sistema
          </h3>
        </div>
        <p className="text-gray-700 text-sm">
          Configure parâmetros gerais de funcionamento do sistema.
        </p>
      </div>

      {/* Conexão e Performance */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Zap size={20} />
          Conexão e Performance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Reconexão Automática
              </label>
              <button
                onClick={() =>
                  handleSettingChange("autoReconnect", !settings.autoReconnect)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoReconnect ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoReconnect ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Tentar reconectar automaticamente em caso de queda
            </p>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Sessões Simultâneas
            </label>
            <select
              value={settings.maxConcurrentSessions}
              onChange={(e) =>
                handleSettingChange("maxConcurrentSessions", e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">1 sessão</option>
              <option value="3">3 sessões</option>
              <option value="5">5 sessões</option>
              <option value="10">10 sessões</option>
            </select>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeout da API (segundos)
            </label>
            <input
              type="number"
              min="10"
              max="120"
              value={settings.apiTimeout}
              onChange={(e) =>
                handleSettingChange("apiTimeout", e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retenção de Mensagens (dias)
            </label>
            <select
              value={settings.messageRetention}
              onChange={(e) =>
                handleSettingChange("messageRetention", e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">7 dias</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
              <option value="365">1 ano</option>
              <option value="-1">Ilimitado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs e Monitoramento */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Database size={20} />
          Logs e Monitoramento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Habilitar Logs
              </label>
              <button
                onClick={() =>
                  handleSettingChange("enableLogging", !settings.enableLogging)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableLogging ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableLogging ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Registrar atividades do sistema para diagnóstico
            </p>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível de Log
            </label>
            <select
              value={settings.logLevel}
              onChange={(e) => handleSettingChange("logLevel", e.target.value)}
              disabled={!settings.enableLogging}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="error">Apenas Erros</option>
              <option value="warn">Avisos e Erros</option>
              <option value="info">Informações</option>
              <option value="debug">Debug</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Database size={20} />
          Backup e Recuperação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Backup Automático
              </label>
              <button
                onClick={() =>
                  handleSettingChange("backupEnabled", !settings.backupEnabled)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.backupEnabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.backupEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Fazer backup automático dos dados
            </p>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequência do Backup
            </label>
            <select
              value={settings.backupFrequency}
              onChange={(e) =>
                handleSettingChange("backupFrequency", e.target.value)
              }
              disabled={!settings.backupEnabled}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="hourly">A cada hora</option>
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Último Backup</h4>
              <p className="text-sm text-gray-600">
                Hoje às 03:00 • Tamanho: 245 MB
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Download
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Fazer Backup Agora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Informações do Sistema
        </h3>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Versão:</span>
            <span className="text-sm font-mono text-gray-900">v2.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Uptime:</span>
            <span className="text-sm text-gray-900">7 dias, 12 horas</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Uso de Memória:</span>
            <span className="text-sm text-gray-900">2.1 GB / 8.0 GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">CPU:</span>
            <span className="text-sm text-gray-900">15%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
