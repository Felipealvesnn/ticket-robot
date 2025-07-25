"use client";

import { useIgnoredContactsStore } from "@/store/ignored-contacts";
import { useSessionsStore } from "@/store/sessions";
import * as Types from "@/types";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AlertCircle,
  Calendar,
  Edit,
  ExpandIcon,
  Filter,
  Globe,
  Phone,
  Plus,
  Search,
  Trash2,
  UserMinus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";

// Schemas de validação
const addContactSchema = yup.object({
  phoneNumber: yup
    .string()
    .required("Número de telefone é obrigatório")
    .matches(/^\d+$/, "Número deve conter apenas dígitos"),
  reason: yup.string().optional().default(""),
  isGlobal: yup.boolean().required().default(true),
  sessionId: yup.string().optional().default(""),
});

const editContactSchema = yup.object({
  phoneNumber: yup
    .string()
    .required("Número de telefone é obrigatório")
    .matches(/^\d+$/, "Número deve conter apenas dígitos"),
  reason: yup.string().optional().default(""),
  isGlobal: yup.boolean().required(),
  sessionId: yup.string().optional().default(""),
});

type AddContactFormData = yup.InferType<typeof addContactSchema>;
type EditContactFormData = yup.InferType<typeof editContactSchema>;

interface IgnoredContactsSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export default function IgnoredContactsSettings({
  onUnsavedChanges,
}: IgnoredContactsSettingsProps) {
  const {
    ignoredContacts,
    stats,
    isLoading,
    error,
    searchQuery,
    selectedFilters,
    loadIgnoredContacts,
    loadStats,
    createIgnoredContact,
    updateIgnoredContact,
    deleteIgnoredContact,
    searchIgnoredContacts,
    setFilters,
    clearFilters,
  } = useIgnoredContactsStore();

  const { sessions, loadSessions } = useSessionsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] =
    useState<Types.IgnoredContact | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadIgnoredContacts();
    loadStats();
    if (sessions.length === 0) {
      loadSessions();
    }
  }, [loadIgnoredContacts, loadStats, loadSessions, sessions.length]);

  const handleAddContact = async (data: Types.CreateIgnoredContactRequest) => {
    try {
      await createIgnoredContact(data);
      setShowAddModal(false);
      onUnsavedChanges(false);
    } catch (error) {
      console.error("Erro ao adicionar contato ignorado:", error);
    }
  };

  const handleUpdateContact = async (
    id: string,
    data: Types.UpdateIgnoredContactRequest
  ) => {
    try {
      await updateIgnoredContact(id, data);
      setEditingContact(null);
      onUnsavedChanges(false);
    } catch (error) {
      console.error("Erro ao atualizar contato ignorado:", error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <ExpandIcon className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Remover contato ignorado
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Tem certeza que deseja remover este contato da lista de
                    ignorados?
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
                    try {
                      await deleteIgnoredContact(id);
                      onUnsavedChanges(false);
                    } catch (error) {
                      console.error("Erro ao remover contato ignorado:", error);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        );
      },
    });
  };

  const handleFilterChange = (filters: {
    isGlobal?: boolean;
    sessionId?: string;
  }) => {
    setFilters(filters);
  };

  return (
    <div className="space-y-6">
      {/* Descrição */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <UserMinus className="text-blue-600" size={20} />
          <h3 className="font-medium text-blue-900">
            Sobre Contatos Ignorados
          </h3>
        </div>
        <p className="text-blue-800 text-sm">
          Gerencie números de telefone que devem ser ignorados pelo bot.
          Contatos ignorados não receberão respostas automáticas e suas
          mensagens não serão processadas pelo sistema de automação.
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <AlertCircle className="text-red-500" size={20} />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Globais</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.global}
                </p>
              </div>
              <Globe className="text-blue-500" size={20} />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Por Sessão</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.perSession}
                </p>
              </div>
              <Phone className="text-green-500" size={20} />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.recentlyAdded}
                </p>
              </div>
              <Calendar className="text-purple-500" size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por número de telefone..."
            value={searchQuery}
            onChange={(e) => searchIgnoredContacts(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter size={16} />
            Filtros
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </div>

      {/* Filtros expandidos */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={
                  selectedFilters.isGlobal === undefined
                    ? ""
                    : selectedFilters.isGlobal.toString()
                }
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({
                    ...selectedFilters,
                    isGlobal: value === "" ? undefined : value === "true",
                  });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="true">Globais</option>
                <option value="false">Por Sessão</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sessão
              </label>
              <select
                value={selectedFilters.sessionId || ""}
                onChange={(e) => {
                  handleFilterChange({
                    ...selectedFilters,
                    sessionId: e.target.value || undefined,
                  });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as sessões</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Lista de contatos ignorados */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando contatos...</p>
          </div>
        ) : ignoredContacts.length === 0 ? (
          <div className="p-8 text-center">
            <UserMinus className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Nenhum contato ignorado
            </h3>
            <p className="mt-1 text-gray-600">
              Adicione números de telefone para que o bot os ignore
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Adicionar Primeiro Contato
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ignoredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Phone className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm font-medium text-gray-900">
                          {contact.phoneNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contact.isGlobal
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {contact.isGlobal ? (
                          <>
                            <Globe size={12} className="mr-1" />
                            Global
                          </>
                        ) : (
                          "Por Sessão"
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.sessionId
                        ? sessions.find((s) => s.id === contact.sessionId)
                            ?.name || contact.sessionId
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.reason || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingContact(contact)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      {showAddModal && (
        <AddIgnoredContactModal
          sessions={sessions}
          onSubmit={handleAddContact}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingContact && (
        <EditIgnoredContactModal
          contact={editingContact}
          sessions={sessions}
          onSubmit={(data) => handleUpdateContact(editingContact.id, data)}
          onClose={() => setEditingContact(null)}
        />
      )}
    </div>
  );
}

// Modal components
function AddIgnoredContactModal({
  sessions,
  onSubmit,
  onClose,
}: {
  sessions: Types.Session[];
  onSubmit: (data: Types.CreateIgnoredContactRequest) => Promise<void>;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddContactFormData>({
    resolver: yupResolver(addContactSchema),
    defaultValues: {
      phoneNumber: "",
      reason: "",
      isGlobal: true,
      sessionId: "",
    },
  });

  const isGlobal = watch("isGlobal");

  const onFormSubmit = async (data: AddContactFormData) => {
    setIsLoading(true);
    try {
      await onSubmit({
        phoneNumber: data.phoneNumber.trim(),
        reason: data.reason?.trim() || undefined,
        isGlobal: data.isGlobal,
        sessionId: data.isGlobal ? undefined : data.sessionId || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar contato:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Adicionar Contato Ignorado
        </h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Telefone *
            </label>
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Ex: 5511999999999"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phoneNumber ? "border-red-300" : "border-gray-300"
                  }`}
                />
              )}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo (opcional)
            </label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Ex: Spam, Concorrente, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Ignore
            </label>
            <Controller
              name="isGlobal"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      checked={field.value === true}
                      onChange={() => field.onChange(true)}
                      className="mr-2"
                    />
                    <span className="text-sm">Global (todas as sessões)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      checked={field.value === false}
                      onChange={() => field.onChange(false)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      Apenas para uma sessão específica
                    </span>
                  </label>
                </div>
              )}
            />
          </div>

          {!isGlobal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sessão
              </label>
              <Controller
                name="sessionId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.sessionId ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione uma sessão</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.sessionId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.sessionId.message}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditIgnoredContactModal({
  contact,
  sessions,
  onSubmit,
  onClose,
}: {
  contact: Types.IgnoredContact;
  sessions: Types.Session[];
  onSubmit: (data: Types.UpdateIgnoredContactRequest) => Promise<void>;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EditContactFormData>({
    resolver: yupResolver(editContactSchema),
    defaultValues: {
      phoneNumber: contact.phoneNumber,
      reason: contact.reason || "",
      isGlobal: contact.isGlobal,
      sessionId: contact.sessionId || "",
    },
  });

  const isGlobal = watch("isGlobal");

  const onFormSubmit = async (data: EditContactFormData) => {
    setIsLoading(true);
    try {
      await onSubmit({
        phoneNumber: data.phoneNumber.trim(),
        reason: data.reason?.trim() || undefined,
        isGlobal: data.isGlobal,
        sessionId: data.isGlobal ? undefined : data.sessionId || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar contato:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Editar Contato Ignorado
        </h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Telefone *
            </label>
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Ex: 5511999999999"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phoneNumber ? "border-red-300" : "border-gray-300"
                  }`}
                />
              )}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo (opcional)
            </label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Ex: Spam, Concorrente, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Ignore
            </label>
            <Controller
              name="isGlobal"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type-edit"
                      checked={field.value === true}
                      onChange={() => field.onChange(true)}
                      className="mr-2"
                    />
                    <span className="text-sm">Global (todas as sessões)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type-edit"
                      checked={field.value === false}
                      onChange={() => field.onChange(false)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      Apenas para uma sessão específica
                    </span>
                  </label>
                </div>
              )}
            />
          </div>

          {!isGlobal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sessão
              </label>
              <Controller
                name="sessionId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.sessionId ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione uma sessão</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.sessionId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.sessionId.message}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
