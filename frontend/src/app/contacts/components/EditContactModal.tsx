"use client";

import * as Types from "@/types";
import {
  PhoneIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "react-toastify";

interface EditContactModalProps {
  contact: Types.Contact;
  onSave: (id: string, data: Types.UpdateContactRequest) => void;
  onClose: () => void;
}

export default function EditContactModal({
  contact,
  onSave,
  onClose,
}: EditContactModalProps) {
  const [name, setName] = useState(contact.name || "");
  const [phoneNumber, setPhoneNumber] = useState(contact.phoneNumber || "");
  const [avatar, setAvatar] = useState(contact.avatar || "");
  const [tags, setTags] = useState<string[]>(contact.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>(
    contact.customFields || {}
  );
  const [isBlocked, setIsBlocked] = useState(contact.isBlocked || false);
  const [loading, setLoading] = useState(false);

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
    setName(contact.name || "");
    setPhoneNumber(contact.phoneNumber || "");
    setAvatar(contact.avatar || "");
    setTags(contact.tags || []);
    setTagInput("");
    setCustomFields(contact.customFields || {});
    setIsBlocked(contact.isBlocked || false);
    onClose();
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const updateData: Types.UpdateContactRequest = {
        ...(name.trim() !== (contact.name || "") && {
          name: name.trim() || undefined,
        }),
        ...(avatar.trim() !== (contact.avatar || "") && {
          avatar: avatar.trim() || undefined,
        }),
        ...(JSON.stringify(tags) !== JSON.stringify(contact.tags || []) && {
          tags: JSON.stringify(tags),
        }),
        ...(JSON.stringify(customFields) !==
          JSON.stringify(contact.customFields || {}) && {
          customFields: JSON.stringify(customFields),
        }),
        ...(isBlocked !== contact.isBlocked && { isBlocked }),
      };

      // Só salvar se houve mudanças
      if (Object.keys(updateData).length > 0) {
        onSave(contact.id, updateData);
      } else {
        toast.info("Nenhuma alteração foi feita.");
        handleClose();
      }
    } catch (error) {
      console.error("Erro ao atualizar contato:", error);
      toast.error("Erro ao atualizar contato. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      name.trim() !== (contact.name || "") ||
      avatar.trim() !== (contact.avatar || "") ||
      JSON.stringify(tags) !== JSON.stringify(contact.tags || []) ||
      JSON.stringify(customFields) !==
        JSON.stringify(contact.customFields || {}) ||
      isBlocked !== contact.isBlocked
    );
  };

  const isFormValid = true; // Sempre válido já que telefone não é editável

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
                Editar Contato
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Edite as informações do contato
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
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
                    placeholder="Digite o nome do contato"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <div className="relative">
                    <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      readOnly
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    O telefone não pode ser alterado após a criação do contato.
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

                {/* Status do Contato */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isBlocked"
                    checked={isBlocked}
                    onChange={(e) => setIsBlocked(e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isBlocked"
                    className="text-sm font-medium text-gray-700"
                  >
                    Bloquear contato
                  </label>
                  <div className="ml-2 group relative">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Contatos bloqueados não podem enviar mensagens
                    </div>
                  </div>
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
                      <TrashIcon className="w-4 h-4" />
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
              disabled={!isFormValid || !hasChanges() || loading}
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
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
