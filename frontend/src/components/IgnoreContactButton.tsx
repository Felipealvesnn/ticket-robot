"use client";

import { useIgnoredContactsStore } from "@/store/ignored-contacts";
import * as Types from "@/types";
import { yupResolver } from "@hookform/resolvers/yup";
import { AlertCircle, Plus, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";

// Schema de validação para o modal
const addIgnoreSchema = yup.object({
  reason: yup.string().optional().default(""),
  isGlobal: yup.boolean().required().default(true),
});

type AddIgnoreFormData = yup.InferType<typeof addIgnoreSchema>;

interface IgnoreContactButtonProps {
  phoneNumber: string;
  sessionId?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function IgnoreContactButton({
  phoneNumber,
  sessionId,
  className = "",
  size = "md",
  showLabel = true,
}: IgnoreContactButtonProps) {
  const {
    isPhoneIgnored,
    createIgnoredContact,
    deleteIgnoredContact,
    ignoredContacts,
    loadIgnoredContacts,
  } = useIgnoredContactsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Carregar contatos ignorados se ainda não foram carregados
  useEffect(() => {
    if (ignoredContacts.length === 0) {
      loadIgnoredContacts();
    }
  }, [ignoredContacts.length, loadIgnoredContacts]);

  const isIgnored = isPhoneIgnored(phoneNumber, sessionId);
  const ignoredContact = ignoredContacts.find(
    (contact) =>
      contact.phoneNumber === phoneNumber &&
      (contact.isGlobal || contact.sessionId === sessionId)
  );

  const handleToggleIgnore = async () => {
    if (isIgnored && ignoredContact) {
      // Remover da lista de ignorados
      setIsLoading(true);
      try {
        await deleteIgnoredContact(ignoredContact.id);
      } catch (error) {
        console.error("Erro ao remover contato ignorado:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Adicionar à lista de ignorados
      setShowModal(true);
    }
  };

  const handleAddIgnoredContact = async (
    data: Types.CreateIgnoredContactRequest
  ) => {
    setIsLoading(true);
    try {
      await createIgnoredContact({
        ...data,
        phoneNumber,
      });
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao adicionar contato ignorado:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  return (
    <>
      <button
        onClick={handleToggleIgnore}
        disabled={isLoading}
        className={`
          flex items-center gap-2 rounded-lg font-medium transition-colors
          ${
            isIgnored
              ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
          }
          ${sizeClasses[size]}
          ${className}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : isIgnored ? (
          <UserX size={iconSizes[size]} />
        ) : (
          <Plus size={iconSizes[size]} />
        )}
        {showLabel && <span>{isIgnored ? "Ignorado" : "Ignorar"}</span>}
      </button>

      {/* Modal para adicionar contato ignorado */}
      {showModal && (
        <AddIgnoreModal
          phoneNumber={phoneNumber}
          sessionId={sessionId}
          onSubmit={handleAddIgnoredContact}
          onClose={() => setShowModal(false)}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

interface IgnoreContactStatusProps {
  phoneNumber: string;
  sessionId?: string;
  className?: string;
}

export function IgnoreContactStatus({
  phoneNumber,
  sessionId,
  className = "",
}: IgnoreContactStatusProps) {
  const { isPhoneIgnored, ignoredContacts } = useIgnoredContactsStore();

  const isIgnored = isPhoneIgnored(phoneNumber, sessionId);
  const ignoredContact = ignoredContacts.find(
    (contact) =>
      contact.phoneNumber === phoneNumber &&
      (contact.isGlobal || contact.sessionId === sessionId)
  );

  if (!isIgnored) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
        <AlertCircle size={12} />
        <span>Ignorado</span>
      </div>
      {ignoredContact?.reason && (
        <span className="text-xs text-gray-500">({ignoredContact.reason})</span>
      )}
    </div>
  );
}

// Modal para adicionar contato ignorado
function AddIgnoreModal({
  phoneNumber,
  sessionId,
  onSubmit,
  onClose,
  isLoading,
}: {
  phoneNumber: string;
  sessionId?: string;
  onSubmit: (data: Types.CreateIgnoredContactRequest) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddIgnoreFormData>({
    resolver: yupResolver(addIgnoreSchema),
    defaultValues: {
      reason: "",
      isGlobal: !sessionId, // Se não tem sessionId, default para global
    },
  });

  const onFormSubmit = async (data: AddIgnoreFormData) => {
    await onSubmit({
      phoneNumber,
      reason: data.reason?.trim() || undefined,
      isGlobal: data.isGlobal,
      sessionId: data.isGlobal ? undefined : sessionId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ignorar Contato
        </h2>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-yellow-600" size={16} />
            <span className="text-sm text-yellow-800">
              Número: <strong>{phoneNumber}</strong>
            </span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Este contato será ignorado pelo bot e não receberá respostas
            automáticas.
          </p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
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
                  placeholder="Ex: Spam, Solicitação do cliente, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            />
          </div>

          {sessionId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Escopo
              </label>
              <Controller
                name="isGlobal"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scope"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        className="mr-2"
                      />
                      <span className="text-sm">Global (todas as sessões)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scope"
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        className="mr-2"
                      />
                      <span className="text-sm">Apenas esta sessão</span>
                    </label>
                  </div>
                )}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Ignorando..." : "Ignorar Contato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
