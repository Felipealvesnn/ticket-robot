"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import { Globe, Monitor, Moon, Palette, Sun, Type } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface AppearanceSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function AppearanceSettings({
  onUnsavedChanges,
}: AppearanceSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const [settings, setSettings] = useState({
    theme: theme,
    language: "pt-BR",
    fontSize: "medium",
    compactMode: false,
    animations: true,
    colorScheme: "blue",
  });

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Se for mudança de tema, aplicar imediatamente
    if (key === "theme" && typeof value === "string") {
      setTheme(value);
      console.log("🎨 Aplicando tema:", value);
    }

    onUnsavedChanges(true);
  };

  // Mostrar skeleton durante carregamento
  if (!mounted) {
    return (
      <div className="space-y-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    // Simular salvamento
    setTimeout(() => {
      toast.success("Configurações salvas com sucesso!");
      onUnsavedChanges(false);
    }, 500);
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
      id: "system",
      name: "Sistema",
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
    <div className="space-y-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="text-purple-600 dark:text-purple-400" size={20} />
          <h3 className="font-medium text-purple-900 dark:text-purple-100">
            Personalização da Interface
          </h3>
        </div>
        <p className="text-purple-800 dark:text-purple-200 text-sm">
          Customize a aparência do sistema de acordo com suas preferências.
        </p>
      </div>

      {/* Tema */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Tema
        </h3>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Seletor de Tema
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Escolha entre claro, escuro ou seguir o sistema
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.id; // Usar o tema atual do store

            return (
              <button
                key={themeOption.id}
                onClick={() => {
                  console.log("🎨 Selecionando tema:", themeOption.id);
                  handleSettingChange("theme", themeOption.id);
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon
                    size={20}
                    className={
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400"
                    }
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {themeOption.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {themeOption.description}
                </p>
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

      {/* Botão de Salvar */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
