"use client";

import { Globe, Monitor, Moon, Palette, Sun, Type } from "lucide-react";
import { useState } from "react";

interface AppearanceSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function AppearanceSettings({
  onUnsavedChanges,
}: AppearanceSettingsProps) {
  const [settings, setSettings] = useState({
    theme: "light",
    language: "pt-BR",
    fontSize: "medium",
    compactMode: false,
    animations: true,
    colorScheme: "blue",
  });

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    onUnsavedChanges(true);
  };

  const themes = [
    { id: "light", name: "Claro", icon: Sun, description: "Tema claro padrão" },
    {
      id: "dark",
      name: "Escuro",
      icon: Moon,
      description: "Tema escuro para uso noturno",
    },
    {
      id: "auto",
      name: "Automático",
      icon: Monitor,
      description: "Segue as preferências do sistema",
    },
  ];

  const colorSchemes = [
    { id: "blue", name: "Azul", color: "bg-blue-500" },
    { id: "green", name: "Verde", color: "bg-green-500" },
    { id: "purple", name: "Roxo", color: "bg-purple-500" },
    { id: "red", name: "Vermelho", color: "bg-red-500" },
    { id: "orange", name: "Laranja", color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="text-purple-600" size={20} />
          <h3 className="font-medium text-purple-900">
            Personalização da Interface
          </h3>
        </div>
        <p className="text-purple-800 text-sm">
          Customize a aparência do sistema de acordo com suas preferências.
        </p>
      </div>

      {/* Tema */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Tema</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((theme) => {
            const Icon = theme.icon;
            const isSelected = settings.theme === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => handleSettingChange("theme", theme.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon
                    size={20}
                    className={isSelected ? "text-blue-600" : "text-gray-400"}
                  />
                  <span className="font-medium text-gray-900">
                    {theme.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{theme.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Esquema de Cores */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Esquema de Cores</h3>

        <div className="flex flex-wrap gap-3">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => handleSettingChange("colorScheme", scheme.id)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                settings.colorScheme === scheme.id
                  ? "border-gray-400 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-4 h-4 rounded-full ${scheme.color}`}></div>
              <span className="text-sm font-medium text-gray-900">
                {scheme.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Idioma */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Globe size={20} />
          Idioma
        </h3>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idioma da Interface
          </label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange("language", e.target.value)}
            className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
          <p className="text-sm text-gray-600 mt-1">
            O idioma será alterado após recarregar a página
          </p>
        </div>
      </div>

      {/* Tipografia */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Type size={20} />
          Tipografia
        </h3>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tamanho da Fonte
          </label>
          <div className="flex gap-2">
            {["small", "medium", "large"].map((size) => (
              <button
                key={size}
                onClick={() => handleSettingChange("fontSize", size)}
                className={`px-4 py-2 border rounded-lg transition-all ${
                  settings.fontSize === size
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={`font-medium ${
                    size === "small"
                      ? "text-sm"
                      : size === "large"
                      ? "text-lg"
                      : "text-base"
                  }`}
                >
                  {size === "small"
                    ? "Pequeno"
                    : size === "medium"
                    ? "Médio"
                    : "Grande"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Outras Opções */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Outras Opções</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Modo Compacto</h4>
              <p className="text-sm text-gray-600">
                Reduz o espaçamento para mostrar mais conteúdo
              </p>
            </div>
            <button
              onClick={() =>
                handleSettingChange("compactMode", !settings.compactMode)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.compactMode ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.compactMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Animações</h4>
              <p className="text-sm text-gray-600">
                Habilitar transições e animações suaves
              </p>
            </div>
            <button
              onClick={() =>
                handleSettingChange("animations", !settings.animations)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.animations ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.animations ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Preview</h3>

        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Exemplo de Card
            </h4>
            <p className="text-gray-600 mb-4">
              Esta é uma prévia de como o sistema ficará com as configurações
              selecionadas.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">JD</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">João Silva</p>
              <p className="text-sm text-gray-600">
                Última mensagem há 5 minutos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
