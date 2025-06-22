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
import { Node } from "reactflow";

interface EditNodeModalProps {
  show: boolean;
  onClose: () => void;
  selectedNode: Node | undefined;
  nodeLabel: string;
  setNodeLabel: (label: string) => void;
  nodeMessage: string;
  setNodeMessage: (message: string) => void;
  nodeCondition: string;
  setNodeCondition: (condition: string) => void;
  nodeAction: string;
  setNodeAction: (action: string) => void;
}

export default function EditNodeModal({
  show,
  onClose,
  selectedNode,
  nodeLabel,
  setNodeLabel,
  nodeMessage,
  setNodeMessage,
  nodeCondition,
  setNodeCondition,
  nodeAction,
  setNodeAction,
}: EditNodeModalProps) {
  const { updateNodeData, selectedNodeId } = useFlowsStore();

  const handleSaveChanges = () => {
    if (!selectedNodeId) return;

    const nodeData: any = {
      label: nodeLabel,
    };

    if (nodeMessage.trim()) nodeData.message = nodeMessage;
    if (nodeCondition.trim()) nodeData.condition = nodeCondition;
    if (nodeAction.trim()) nodeData.action = nodeAction;

    updateNodeData(selectedNodeId, nodeData);
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} size="lg">
      <ModalHeader>⚙️ Editar {selectedNode?.data?.type}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título/Label
            </label>
            <TextInput
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              placeholder="Título do nó"
              autoFocus
            />
          </div>

          {selectedNode?.data?.type === "message" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <Textarea
                value={nodeMessage}
                onChange={(e) => setNodeMessage(e.target.value)}
                placeholder="Digite a mensagem que será enviada..."
                rows={4}
              />
            </div>
          )}

          {selectedNode?.data?.type === "condition" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condição
              </label>
              <Textarea
                value={nodeCondition}
                onChange={(e) => setNodeCondition(e.target.value)}
                placeholder="Ex: user_input.includes('sim')"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Para menus com opções, use o editor avançado de condições no
                painel direito.
              </p>
            </div>
          )}

          {selectedNode?.data?.type === "action" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ação
              </label>
              <TextInput
                value={nodeAction}
                onChange={(e) => setNodeAction(e.target.value)}
                placeholder="Ex: send_email, transfer_to_agent"
              />
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={handleSaveChanges}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Salvar Alterações
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
