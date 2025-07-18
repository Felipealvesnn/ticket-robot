"use client";

import { FC, useState } from "react";

interface CreateFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export const CreateFlowModal: FC<CreateFlowModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");

  const handleCreate = () => {
    if (newFlowName.trim()) {
      onCreate(newFlowName.trim(), newFlowDescription.trim());
      // Reset form
      setNewFlowName("");
      setNewFlowDescription("");
    }
  };

  const handleClose = () => {
    setNewFlowName("");
    setNewFlowDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        />

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div
          className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Criar Novo Flow
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="flow-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nome do Flow
                    </label>
                    <input
                      type="text"
                      id="flow-name"
                      value={newFlowName}
                      onChange={(e) => setNewFlowName(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      placeholder="Ex: Atendimento ao Cliente"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newFlowName.trim()) {
                          handleCreate();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="flow-description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Descrição (opcional)
                    </label>
                    <textarea
                      id="flow-description"
                      rows={3}
                      value={newFlowDescription}
                      onChange={(e) => setNewFlowDescription(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      placeholder="Descreva o propósito deste flow..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newFlowName.trim()}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Criar Flow
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
