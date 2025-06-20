import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Edge,
  Node,
  Connection,
} from "reactflow";

export interface ChatFlow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  triggers: string[]; // Palavras-chave que ativam o flow
}

export interface FlowNode {
  id: string;
  type: "start" | "message" | "condition" | "action" | "end";
  data: {
    label: string;
    message?: string;
    condition?: string;
    action?: string;
    delay?: number;
    mediaUrl?: string;
    mediaType?: "image" | "audio" | "video" | "document";
  };
  position: { x: number; y: number };
}

interface FlowsState {
  // Estado
  flows: ChatFlow[];
  currentFlow: ChatFlow | null;
  isLoading: boolean;
  error: string | null;

  // Editor state
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Ações
  createFlow: (name: string, description: string) => void;
  updateFlow: (id: string, updates: Partial<ChatFlow>) => void;
  deleteFlow: (id: string) => void;
  duplicateFlow: (id: string) => void;
  setCurrentFlow: (flow: ChatFlow | null) => void;

  // Editor actions
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: FlowNode["type"], position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<FlowNode["data"]>) => void;
  setSelectedNode: (id: string | null) => void;

  // Flow execution
  saveCurrentFlow: () => void;
  testFlow: (startMessage: string) => Promise<string[]>;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Templates de flows predefinidos
const defaultFlows: ChatFlow[] = [
  {
    id: "1",
    name: "Boas-vindas",
    description: "Flow padrão de boas-vindas para novos contatos",
    nodes: [
      {
        id: "start-1",
        type: "input",
        position: { x: 100, y: 100 },
        data: {
          label: "Início",
          message: "Olá! Bem-vindo ao nosso atendimento!",
        },
      },
      {
        id: "message-1",
        type: "default",
        position: { x: 300, y: 100 },
        data: {
          label: "Mensagem de Boas-vindas",
          message: "Como posso ajudá-lo hoje?",
        },
      },
      {
        id: "condition-1",
        type: "default",
        position: { x: 500, y: 100 },
        data: {
          label: "Aguardar Resposta",
          condition: "user_response",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "start-1",
        target: "message-1",
        type: "smoothstep",
      },
      {
        id: "e2-3",
        source: "message-1",
        target: "condition-1",
        type: "smoothstep",
      },
    ],
    isActive: true,
    createdAt: "2025-06-19T10:00:00Z",
    updatedAt: "2025-06-19T10:00:00Z",
    triggers: ["oi", "olá", "hello", "hi"],
  },
  {
    id: "2",
    name: "Suporte Técnico",
    description: "Flow para direcionamento de suporte técnico",
    nodes: [
      {
        id: "start-2",
        type: "input",
        position: { x: 100, y: 100 },
        data: {
          label: "Problema Técnico",
          message: "Entendi que você está com um problema técnico.",
        },
      },
      {
        id: "message-2",
        type: "default",
        position: { x: 300, y: 100 },
        data: {
          label: "Coleta de Informações",
          message: "Poderia me descrever o problema em detalhes?",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "start-2",
        target: "message-2",
        type: "smoothstep",
      },
    ],
    isActive: true,
    createdAt: "2025-06-19T11:00:00Z",
    updatedAt: "2025-06-19T11:00:00Z",
    triggers: ["problema", "erro", "bug", "suporte", "ajuda"],
  },
];

export const useFlowsStore = create<FlowsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        flows: defaultFlows,
        currentFlow: null,
        isLoading: false,
        error: null,

        // Editor state
        nodes: [],
        edges: [],
        selectedNodeId: null,

        // Ações
        createFlow: (name: string, description: string) => {
          const newFlow: ChatFlow = {
            id: Date.now().toString(),
            name,
            description,
            nodes: [
              {
                id: "start-" + Date.now(),
                type: "input",
                position: { x: 100, y: 100 },
                data: {
                  label: "Início",
                  message: "Mensagem inicial do flow",
                },
              },
            ],
            edges: [],
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            triggers: [],
          };

          set((state) => ({
            flows: [newFlow, ...state.flows],
            currentFlow: newFlow,
            nodes: newFlow.nodes,
            edges: newFlow.edges,
          }));
        },

        updateFlow: (id: string, updates: Partial<ChatFlow>) => {
          set((state) => ({
            flows: state.flows.map((flow) =>
              flow.id === id
                ? { ...flow, ...updates, updatedAt: new Date().toISOString() }
                : flow
            ),
          }));
        },

        deleteFlow: (id: string) => {
          set((state) => ({
            flows: state.flows.filter((flow) => flow.id !== id),
            currentFlow:
              state.currentFlow?.id === id ? null : state.currentFlow,
          }));
        },

        duplicateFlow: (id: string) => {
          const { flows } = get();
          const flowToDuplicate = flows.find((f) => f.id === id);

          if (flowToDuplicate) {
            const newFlow: ChatFlow = {
              ...flowToDuplicate,
              id: Date.now().toString(),
              name: `${flowToDuplicate.name} (Cópia)`,
              isActive: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            set((state) => ({
              flows: [newFlow, ...state.flows],
            }));
          }
        },

        setCurrentFlow: (flow: ChatFlow | null) => {
          set({
            currentFlow: flow,
            nodes: flow?.nodes || [],
            edges: flow?.edges || [],
            selectedNodeId: null,
          });
        },

        // Editor actions
        onNodesChange: (changes) => {
          set((state) => ({
            nodes: applyNodeChanges(changes, state.nodes),
          }));
        },

        onEdgesChange: (changes) => {
          set((state) => ({
            edges: applyEdgeChanges(changes, state.edges),
          }));
        },

        onConnect: (connection) => {
          set((state) => ({
            edges: addEdge(connection, state.edges),
          }));
        },

        addNode: (type, position) => {
          const newNode: Node = {
            id: `${type}-${Date.now()}`,
            type: type === "start" ? "input" : "default",
            position,
            data: {
              label:
                type === "start"
                  ? "Início"
                  : type === "message"
                  ? "Nova Mensagem"
                  : type === "condition"
                  ? "Condição"
                  : type === "action"
                  ? "Ação"
                  : "Fim",
              message:
                type === "message" ? "Digite sua mensagem aqui..." : undefined,
              condition: type === "condition" ? "user_input" : undefined,
              action: type === "action" ? "send_to_human" : undefined,
            },
          };

          set((state) => ({
            nodes: [...state.nodes, newNode],
            selectedNodeId: newNode.id,
          }));
        },

        deleteNode: (id: string) => {
          set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== id),
            edges: state.edges.filter(
              (edge) => edge.source !== id && edge.target !== id
            ),
            selectedNodeId:
              state.selectedNodeId === id ? null : state.selectedNodeId,
          }));
        },

        updateNodeData: (id: string, data: Partial<FlowNode["data"]>) => {
          set((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, ...data } }
                : node
            ),
          }));
        },

        setSelectedNode: (id: string | null) => {
          set({ selectedNodeId: id });
        },

        // Flow execution
        saveCurrentFlow: () => {
          const { currentFlow, nodes, edges, updateFlow } = get();

          if (currentFlow) {
            updateFlow(currentFlow.id, {
              nodes,
              edges,
            });
          }
        },

        testFlow: async (startMessage: string) => {
          const { currentFlow } = get();

          if (!currentFlow) return ["Nenhum flow selecionado"];

          // Simular execução do flow
          const responses: string[] = [];

          // Encontrar nó inicial
          const startNode = currentFlow.nodes.find(
            (node) => node.type === "input"
          );

          if (startNode && startNode.data.message) {
            responses.push(startNode.data.message);
          }

          // Simular algumas respostas baseadas nos nós
          currentFlow.nodes
            .filter((node) => node.data.message && node.type !== "input")
            .slice(0, 3)
            .forEach((node) => {
              if (node.data.message) {
                responses.push(node.data.message);
              }
            });

          return responses;
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },
      }),
      {
        name: "flows-storage",
        partialize: (state) => ({ flows: state.flows }),
      }
    ),
    {
      name: "flows-store",
    }
  )
);
