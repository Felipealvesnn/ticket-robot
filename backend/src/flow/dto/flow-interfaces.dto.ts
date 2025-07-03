/**
 * 🎯 Interfaces para o sistema de fluxos de chatbot
 */

export interface FlowCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  label: string;
  targetNodeId?: string;
}

export interface FlowNode {
  id: string;
  type: string;
  data: {
    label?: string;
    message?: string;
    conditions?: FlowCondition[];
    delay?: number;
    transferMessage?: string;
    awaitInput?: boolean; // Se deve aguardar entrada do usuário (padrão: true para nós message)
    // Campos específicos para nós "input"
    variableName?: string;
    validation?: string;
    placeholder?: string;
    required?: boolean;
    errorMessage?: string;
    [key: string]: unknown;
  };
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ChatFlow {
  id: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  triggers: string[];
}

export interface FlowVariables {
  [key: string]: string | number | boolean | undefined;
  triggerMessage?: string;
  startedAt?: string;
  lastUserMessage?: string;
  lastMessageAt?: string;
  userName?: string;
  phoneNumber?: string;
}

export interface ContactFlowState {
  id: string;
  companyId: string;
  messagingSessionId: string;
  contactId: string;
  chatFlowId: string;
  currentNodeId: string;
  isActive: boolean;
  variables: string | null;
  awaitingInput: boolean;
  createdAt: Date;
  updatedAt: Date;
  chatFlow: {
    id: string;
    nodes: string;
    edges: string;
    triggers: string;
  };
}

export interface FlowExecutionResult {
  success: boolean;
  nextNode?: FlowNode;
  response?: string;
  mediaUrl?: string; // URL para envio de mídia
  mediaType?: 'image' | 'video' | 'audio' | 'document'; // Tipo de mídia
}

export interface FlowHistoryAction {
  ENTERED: 'ENTERED';
  EXECUTED: 'EXECUTED';
  USER_INPUT: 'USER_INPUT';
  CONDITION_MET: 'CONDITION_MET';
  TIMEOUT: 'TIMEOUT';
  ERROR: 'ERROR';
}

export type FlowActionType = keyof FlowHistoryAction;
