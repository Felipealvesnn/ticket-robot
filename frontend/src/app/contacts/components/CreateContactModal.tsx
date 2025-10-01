"use client";

import api from "@/services/api";
import * as Types from "@/types";
import { PhoneIcon, UserIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface CreateContactModalProps {
  onSave: (data: Types.CreateContactRequest) => void;
  onClose: () => void;
}

export default function CreateContactModal({
  onSave,
  onClose,
}: CreateContactModalProps) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatar, setAvatar] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<Types.Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Carregar sessões disponíveis ao abrir o modal
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const sessionsData = await api.sessions.getAll();
      setSessions(sessionsData);

      // Selecionar automaticamente a primeira sessão ativa se existir
      const activeSessions = sessionsData.filter(
        (s) => s.status === "connected"
      );
      if (activeSessions.length > 0) {
        setSelectedSessionId(activeSessions[0].id);
      } else if (sessionsData.length > 0) {
        setSelectedSessionId(sessionsData[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
      toast.error("Erro ao carregar sessões do WhatsApp");
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, "");

    // Aplica máscara brasileira
    if (numbers.length <= 11) {
      if (numbers.length <= 2) {
        return numbers;
      } else if (numbers.length <= 7) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      } else if (numbers.length <= 10) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(
          6
        )}`;
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
          7,
          11
        )}`;
      }
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleClose = () => {
    // Reset form state
    setName("");
    setPhoneNumber("");
    setAvatar("");
    setTags([]);
    setTagInput("");
    setCustomFields({});
    setSelectedSessionId("");
    onClose();
  };

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Telefone é obrigatório!");
      return;
    }

    if (!selectedSessionId) {
      toast.error("Selecione uma sessão do WhatsApp!");
      return;
    }

    setLoading(true);

    try {
      // Limpar o número de telefone (remover formatação)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

      // Adicionar código do país se não existir
      const formattedPhone = cleanPhoneNumber.startsWith("55")
        ? `+${cleanPhoneNumber}`
        : `+55${cleanPhoneNumber}`;

      const contactData: Types.CreateContactRequest = {
        messagingSessionId: selectedSessionId, // ID da sessão de mensageria
        phoneNumber: formattedPhone,
        ...(name.trim() && { name: name.trim() }),
        ...(avatar.trim() && { avatar: avatar.trim() }),
        ...(tags.length > 0 && { tags: JSON.stringify(tags) }), // Tags como JSON string
        ...(Object.keys(customFields).length > 0 && {
          customFields: JSON.stringify(customFields),
        }),
      };

      onSave(contactData);
    } catch (error) {
      console.error("Erro ao criar contato:", error);
      toast.error("Erro ao criar contato. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    phoneNumber.trim() && selectedSessionId && sessions.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        />

        {/* Center alignment trick */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div
          className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <UserIcon className="w-6 h-6 mr-2 text-blue-600" />
                Novo Contato
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Adicione um novo contato ao sistema do WhatsApp
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Sessão do WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sessão do WhatsApp *
              </label>
              {loadingSessions ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Carregando sessões...
                </div>
              ) : sessions.length === 0 ? (
                <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-700">
                  ⚠️ Nenhuma sessão do WhatsApp encontrada. Crie uma sessão
                  primeiro.
                </div>
              ) : (
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma sessão</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                      {session.status === "connected" && " (✓ Conectada)"}
                      {session.status === "disconnected" && " (✗ Desconectada)"}
                      {session.status === "connecting" && " (🔄 Conectando...)"}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Selecione a sessão do WhatsApp para este contato
              </p>
            </div>

            {/* Informações Básicas */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informações Básicas
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite o nome do contato (opcional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional - Nome do contato
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <div className="relative">
                    <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                    {phoneNumber && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {phoneNumber.replace(/\D/g, "").length >= 10 ? (
                          <span className="text-green-500 text-sm">✓</span>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            {phoneNumber.replace(/\D/g, "").length}/11
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Digite apenas números. O formato será aplicado
                    automaticamente.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar (URL)
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://exemplo.com/avatar.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional - URL da foto do contato
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite uma tag e pressione Enter"
                  />
                  <button
                    onClick={handleAddTag}
                    type="button"
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Tags adicionadas */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Opcional - Tags para categorizar o contato
                </p>
              </div>
            </div>

            {/* Campos Customizados */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Campos Customizados
              </h3>
              <div className="space-y-3">
                {Object.entries(customFields).map(([key, value], index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => {
                        const newFields = { ...customFields };
                        delete newFields[key];
                        newFields[e.target.value] = value;
                        setCustomFields(newFields);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome do campo"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        setCustomFields({
                          ...customFields,
                          [key]: e.target.value,
                        });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Valor do campo"
                    />
                    <button
                      onClick={() => {
                        const newFields = { ...customFields };
                        delete newFields[key];
                        setCustomFields(newFields);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const fieldName = `campo_${
                      Object.keys(customFields).length + 1
                    }`;
                    setCustomFields({
                      ...customFields,
                      [fieldName]: "",
                    });
                  }}
                  type="button"
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + Adicionar Campo Customizado
                </button>

                <p className="text-xs text-gray-500">
                  Opcional - Campos adicionais específicos para este contato
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {loading ? "Criando..." : "Criar Contato"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
