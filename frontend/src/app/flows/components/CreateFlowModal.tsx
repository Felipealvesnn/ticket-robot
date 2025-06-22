"use client";

import { useFlowsStore } from "@/store/flows";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Textarea,
} from "flowbite-react";

interface CreateFlowModalProps {
  show: boolean;
  onClose: () => void;
  newFlowName: string;
  setNewFlowName: (name: string) => void;
  newFlowDescription: string;
  setNewFlowDescription: (description: string) => void;
}

export default function CreateFlowModal({
  show,
  onClose,
  newFlowName,
  setNewFlowName,
  newFlowDescription,
  setNewFlowDescription,
}: CreateFlowModalProps) {
  const { createFlow } = useFlowsStore();

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) return;

    createFlow(newFlowName, newFlowDescription);
    setNewFlowName("");
    setNewFlowDescription("");
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>🎨 Criar Novo Flow</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Flow
            </label>
            <TextInput
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              placeholder="Ex: Atendimento ao Cliente"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <Textarea
              value={newFlowDescription}
              onChange={(e) => setNewFlowDescription(e.target.value)}
              placeholder="Descreva o propósito deste flow..."
              rows={3}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={handleCreateFlow}
          disabled={!newFlowName.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Criar Flow
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
