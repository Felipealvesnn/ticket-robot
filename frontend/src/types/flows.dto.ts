// ============================================================================
// 🔄 FLOWS TYPES
// ============================================================================

export interface FlowNode {
  id: string;
  type: "start" | "message" | "condition" | "action" | "delay" | "end";
  position: { x: number; y: number };
  data: {
    label?: string;
    message?: string;
    condition?: string;
    action?: string;
    delay?: number;
    [key: string]: any;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    label?: string;
    condition?: string;
    [key: string]: any;
  };
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  trigger?: {
    type: "keyword" | "event" | "schedule";
    value: string;
  };
  variables?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlowRequest {
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  trigger?: {
    type: "keyword" | "event" | "schedule";
    value: string;
  };
  variables?: Record<string, any>;
}

export interface UpdateFlowRequest {
  name?: string;
  description?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  isActive?: boolean;
  trigger?: {
    type: "keyword" | "event" | "schedule";
    value: string;
  };
  variables?: Record<string, any>;
}

export interface FlowResponse {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  trigger?: {
    type: "keyword" | "event" | "schedule";
    value: string;
  };
  variables?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FlowExecutionResult {
  success: boolean;
  flowId: string;
  sessionId: string;
  contact: string;
  startTime: string;
  endTime?: string;
  currentNode?: string;
  variables?: Record<string, any>;
  error?: string;
}
