"use client";

import api from "@/services/api";
import * as Types from "@/types";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { toast } from "react-toastify";
import CreateContactModal from "./components/CreateContactModal";
import EditContactModal from "./components/EditContactModal";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Types.Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Types.Contact | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await api.contacts.getAll();
      setContacts(response.contacts);
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
      toast.error("Erro ao carregar contatos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = async (
    id: string,
    updateData: Types.UpdateContactRequest
  ) => {
    try {
      const updatedContact = await api.contacts.update(id, updateData);

      // Converter a resposta do backend para o formato esperado
      const formattedContact: Types.Contact = {
        ...updatedContact,
        name: updatedContact.name || "Sem nome",
        tags: updatedContact.tags ? JSON.parse(updatedContact.tags) : [],
        customFields: updatedContact.customFields
          ? JSON.parse(updatedContact.customFields)
          : {},
        lastInteraction: updatedContact.updatedAt,
      };

      // Atualizar o contato na lista local
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === id ? formattedContact : contact
        )
      );

      // Fechar o modal
      setShowEditModal(false);
      setEditingContact(null);

      // Mostrar mensagem de sucesso
      toast.success("Contato atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar contato:", error);
      toast.error("Erro ao atualizar contato. Tente novamente.");
    }
  };

  const handleViewContact = (contact: Types.Contact) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  const handleEditContactClick = (contact: Types.Contact) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  const handleBulkAction = async (action: "block" | "unblock" | "delete") => {
    if (selectedContacts.length === 0) {
      toast.warning("Selecione pelo menos um contato.");
      return;
    }

    const confirmConfig = {
      block: {
        title: "Bloquear Contatos",
        message: `Deseja bloquear ${selectedContacts.length} contato(s)? Eles não receberão mais mensagens.`,
        icon: <NoSymbolIcon className="w-12 h-12 text-yellow-500" />,
      },
      unblock: {
        title: "Desbloquear Contatos",
        message: `Deseja desbloquear ${selectedContacts.length} contato(s)? Eles voltarão a receber mensagens.`,
        icon: <CheckCircleIcon className="w-12 h-12 text-green-500" />,
      },
      delete: {
        title: "Excluir Contatos",
        message: `Deseja excluir ${selectedContacts.length} contato(s)? Esta ação não pode ser desfeita.`,
        icon: <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />,
      },
    };

    const config = confirmConfig[action];

    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            {config.icon}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {config.title}
              </h3>
            </div>
          </div>
          <p className="text-gray-600 mb-6">{config.message}</p>
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                executeBulkAction(action);
                onClose();
              }}
              className={`px-4 py-2 rounded-lg text-white ${
                action === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : action === "block"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      ),
    });
  };

  const executeBulkAction = async (action: "block" | "unblock" | "delete") => {
    try {
      // Processar ações em paralelo
      const promises = selectedContacts.map(async (contactId) => {
        switch (action) {
          case "block":
            return api.contacts.block(contactId);
          case "unblock":
            return api.contacts.unblock(contactId);
          case "delete":
            return api.contacts.delete(contactId);
          default:
            throw new Error("Ação inválida");
        }
      });

      await Promise.all(promises);

      // Atualizar lista local
      if (action === "delete") {
        setContacts((prevContacts) =>
          prevContacts.filter(
            (contact) => !selectedContacts.includes(contact.id)
          )
        );
      } else {
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            selectedContacts.includes(contact.id)
              ? { ...contact, isBlocked: action === "block" }
              : contact
          )
        );
      }

      // Limpar seleção
      setSelectedContacts([]);

      // Mostrar mensagem de sucesso
      const actionNames = {
        block: "bloqueados",
        unblock: "desbloqueados",
        delete: "excluídos",
      };

      toast.success(
        `${selectedContacts.length} contato(s) ${actionNames[action]} com sucesso!`
      );
    } catch (error) {
      console.error(`Erro na ação em lote (${action}):`, error);
      toast.error(
        `Erro ao ${
          action === "delete"
            ? "excluir"
            : action === "block"
            ? "bloquear"
            : "desbloquear"
        } contatos.`
      );
    }
  };

  const handleCreateContact = async (
    contactData: Types.CreateContactRequest
  ) => {
    try {
      const newContact = await api.contacts.create(contactData);

      // Converter a resposta do backend para o formato esperado
      const formattedContact: Types.Contact = {
        ...newContact,
        name: newContact.name || "Sem nome",
        tags: newContact.tags ? JSON.parse(newContact.tags) : [],
        customFields: newContact.customFields
          ? JSON.parse(newContact.customFields)
          : {},
        lastInteraction: newContact.updatedAt,
      };

      // Adicionar o novo contato na lista local
      setContacts((prevContacts) => [formattedContact, ...prevContacts]);

      // Fechar o modal
      setShowCreateModal(false);

      // Mostrar mensagem de sucesso
      toast.success("Contato criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar contato:", error);
      toast.error(
        "Erro ao criar contato. Verifique os dados e tente novamente."
      );
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      (contact.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phoneNumber.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !contact.isBlocked) ||
      (statusFilter === "blocked" && contact.isBlocked);

    return matchesSearch && matchesStatus;
  });

  const toggleSelectContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    setSelectedContacts(
      selectedContacts.length === filteredContacts.length
        ? []
        : filteredContacts.map((c) => c.id)
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UsersIcon className="w-8 h-8 mr-3 text-blue-600" />
                Contatos
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie todos os seus contatos do WhatsApp
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Novo Contato
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar contatos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                  />
                </div>

                {/* Filtro de Status */}
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "active" | "blocked"
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Apenas ativos</option>
                  <option value="blocked">Apenas bloqueados</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {filteredContacts.length} contatos encontrados
                </span>
                {selectedContacts.length > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    {selectedContacts.length} selecionados
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ações em Lote */}
        {selectedContacts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-800 mr-4">
                  {selectedContacts.length} contato(s) selecionado(s)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction("unblock")}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Desbloquear
                </button>
                <button
                  onClick={() => handleBulkAction("block")}
                  className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm flex items-center"
                >
                  <NoSymbolIcon className="w-4 h-4 mr-1" />
                  Bloquear
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Excluir
                </button>
                <button
                  onClick={() => setSelectedContacts([])}
                  className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Contatos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Lista de Contatos
              </h2>
              <button
                onClick={selectAllContacts}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedContacts.length === filteredContacts.length
                  ? "Desmarcar todos"
                  : "Selecionar todos"}
              </button>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm
                    ? "Nenhum contato encontrado"
                    : "Nenhum contato cadastrado"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 w-12">
                        <input
                          type="checkbox"
                          checked={
                            selectedContacts.length === filteredContacts.length
                          }
                          onChange={selectAllContacts}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Contato
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Telefone
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Última Mensagem
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => toggleSelectContact(contact.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              {contact.avatar ? (
                                <img
                                  src={contact.avatar}
                                  alt={contact.name || "Contato"}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <UserIcon className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {contact.name || "Sem nome"}
                              </p>
                              {contact.email && (
                                <p className="text-sm text-gray-500">
                                  {contact.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-mono text-sm">
                              {contact.phoneNumber}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-500">
                            {contact.updatedAt ? (
                              <>
                                <p className="truncate w-48">
                                  Última atividade
                                </p>
                                <p className="text-xs">
                                  {new Date(
                                    contact.updatedAt
                                  ).toLocaleDateString()}
                                </p>
                              </>
                            ) : (
                              "Sem atividade"
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              contact.isBlocked
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {contact.isBlocked ? "Bloqueado" : "Ativo"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewContact(contact)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Visualizar contato"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditContactClick(contact)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Editar contato"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const action = contact.isBlocked
                                  ? "unblock"
                                  : "block";
                                const actionText = contact.isBlocked
                                  ? "desbloquear"
                                  : "bloquear";
                                const icon = contact.isBlocked ? (
                                  <CheckCircleIcon className="w-12 h-12 text-green-500" />
                                ) : (
                                  <NoSymbolIcon className="w-12 h-12 text-yellow-500" />
                                );

                                confirmAlert({
                                  customUI: ({ onClose }) => (
                                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto">
                                      <div className="flex items-center space-x-4 mb-4">
                                        {icon}
                                        <div>
                                          <h3 className="text-lg font-semibold text-gray-900">
                                            {contact.isBlocked
                                              ? "Desbloquear"
                                              : "Bloquear"}{" "}
                                            Contato
                                          </h3>
                                        </div>
                                      </div>
                                      <p className="text-gray-600 mb-6">
                                        Deseja {actionText} o contato{" "}
                                        <strong>
                                          {contact.name || contact.phoneNumber}
                                        </strong>
                                        ?
                                      </p>
                                      <div className="flex space-x-3 justify-end">
                                        <button
                                          onClick={onClose}
                                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedContacts([contact.id]);
                                            executeBulkAction(action);
                                            setSelectedContacts([]);
                                            onClose();
                                          }}
                                          className={`px-4 py-2 rounded-lg text-white ${
                                            contact.isBlocked
                                              ? "bg-green-600 hover:bg-green-700"
                                              : "bg-yellow-600 hover:bg-yellow-700"
                                          }`}
                                        >
                                          Confirmar
                                        </button>
                                      </div>
                                    </div>
                                  ),
                                });
                              }}
                              className={`p-2 rounded-lg ${
                                contact.isBlocked
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-red-600 hover:bg-red-50"
                              }`}
                              title={
                                contact.isBlocked
                                  ? "Desbloquear contato"
                                  : "Bloquear contato"
                              }
                            >
                              {contact.isBlocked ? (
                                <CheckCircleIcon className="w-4 h-4" />
                              ) : (
                                <NoSymbolIcon className="w-4 h-4" />
                              )}
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
        </div>

        {/* Estatísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.filter((c) => !c.isBlocked).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bloqueados</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.filter((c) => c.isBlocked).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PhoneIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Novos Hoje</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    contacts.filter((c) => {
                      const today = new Date();
                      const contactDate = new Date(c.createdAt);
                      return (
                        contactDate.toDateString() === today.toDateString()
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Criar Contato */}
      {showCreateModal && (
        <CreateContactModal
          onSave={handleCreateContact}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Modal de Editar Contato */}
      {showEditModal && editingContact && (
        <EditContactModal
          contact={editingContact}
          onSave={handleEditContact}
          onClose={() => {
            setShowEditModal(false);
            setEditingContact(null);
          }}
        />
      )}
    </div>
  );
}
