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

  // Função para resetar flows (para debug)
  resetToDefaultFlows: () => void;
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
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          type: "start",
          label: "Início",
        },
      },
      {
        id: "message-1",
        type: "custom",
        position: { x: 300, y: 200 },
        data: {
          type: "message",
          label: "Mensagem de Boas-vindas",
          message:
            "Olá! Bem-vindo ao nosso atendimento! Como posso ajudá-lo hoje?",
        },
      },
      {
        id: "end-1",
        type: "custom",
        position: { x: 500, y: 300 },
        data: {
          type: "end",
          label: "Aguardar Resposta",
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
        target: "end-1",
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
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          type: "start",
          label: "Problema Técnico",
        },
      },
      {
        id: "message-2",
        type: "custom",
        position: { x: 300, y: 200 },
        data: {
          type: "message",
          label: "Coleta de Informações",
          message:
            "Entendi que você está com um problema técnico. Poderia me descrever o problema em detalhes?",
        },
      },
      {
        id: "condition-2",
        type: "custom",
        position: { x: 500, y: 300 },
        data: {
          type: "condition",
          label: "Problema Complexo?",
          condition:
            "problema.includes('crítico') || problema.includes('urgente')",
        },
      },
      {
        id: "action-2",
        type: "custom",
        position: { x: 700, y: 400 },
        data: {
          type: "action",
          label: "Encaminhar Técnico",
          action: "transfer_to_technical_support",
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
      {
        id: "e2-3",
        source: "message-2",
        target: "condition-2",
        type: "smoothstep",
      },
      {
        id: "e3-4",
        source: "condition-2",
        target: "action-2",
        type: "smoothstep",
      },
    ],
    isActive: true,
    createdAt: "2025-06-19T11:00:00Z",
    updatedAt: "2025-06-19T11:00:00Z",
    triggers: ["problema", "erro", "bug", "suporte", "ajuda"],
  },
  {
    id: "3",
    name: "Vendas e Orçamento",
    description: "Flow completo para vendas com qualificação de leads",
    nodes: [
      {
        id: "start-3",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          type: "start",
          label: "Interesse em Compra",
        },
      },
      {
        id: "message-3",
        type: "custom",
        position: { x: 300, y: 100 },
        data: {
          type: "message",
          label: "Saudação Vendas",
          message:
            "Olá! Vi que você tem interesse em nossos produtos. Que tipo de solução você está procurando?",
        },
      },
      {
        id: "condition-3",
        type: "custom",
        position: { x: 500, y: 100 },
        data: {
          type: "condition",
          label: "Orçamento Disponível?",
          condition: "orcamento > 1000",
        },
      },
      {
        id: "message-4",
        type: "custom",
        position: { x: 300, y: 250 },
        data: {
          type: "message",
          label: "Qualificar Lead",
          message:
            "Perfeito! Para criar um orçamento personalizado, preciso de algumas informações. Qual é seu orçamento aproximado?",
        },
      },
      {
        id: "action-3",
        type: "custom",
        position: { x: 700, y: 100 },
        data: {
          type: "action",
          label: "Enviar Catálogo Premium",
          action: "send_premium_catalog",
        },
      },
      {
        id: "action-4",
        type: "custom",
        position: { x: 500, y: 250 },
        data: {
          type: "action",
          label: "Agendar Reunião",
          action: "schedule_meeting",
        },
      },
      {
        id: "end-3",
        type: "custom",
        position: { x: 900, y: 175 },
        data: {
          type: "end",
          label: "Aguardar Contato",
        },
      },
    ],
    edges: [
      {
        id: "e3-1",
        source: "start-3",
        target: "message-3",
        type: "smoothstep",
      },
      {
        id: "e3-2",
        source: "message-3",
        target: "message-4",
        type: "smoothstep",
      },
      {
        id: "e3-3",
        source: "message-4",
        target: "condition-3",
        type: "smoothstep",
      },
      {
        id: "e3-4",
        source: "condition-3",
        target: "action-3",
        type: "smoothstep",
        label: "Alto Valor",
      },
      {
        id: "e3-5",
        source: "condition-3",
        target: "action-4",
        type: "smoothstep",
        label: "Padrão",
      },
      {
        id: "e3-6",
        source: "action-3",
        target: "end-3",
        type: "smoothstep",
      },
      {
        id: "e3-7",
        source: "action-4",
        target: "end-3",
        type: "smoothstep",
      },
    ],
    isActive: false,
    createdAt: "2025-06-19T12:00:00Z",
    updatedAt: "2025-06-19T12:00:00Z",
    triggers: ["comprar", "preço", "orçamento", "vendas", "produto"],
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
        error: null, // Editor state
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
                type: "custom",
                position: { x: 100, y: 100 },
                data: {
                  type: "start",
                  label: "Início",
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
            type: "custom", // Usar sempre o tipo custom
            position,
            data: {
              type, // Adicionar o tipo no data
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
              condition:
                type === "condition" ? "user_input == 'sim'" : undefined,
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
            (node) => node.data.type === "start"
          );

          if (startNode) {
            responses.push(`🟢 Iniciando flow: ${startNode.data.label}`);
          }

          // Simular algumas respostas baseadas nos nós de mensagem
          const messageNodes = currentFlow.nodes
            .filter((node) => node.data.type === "message" && node.data.message)
            .slice(0, 2);

          messageNodes.forEach((node) => {
            if (node.data.message) {
              responses.push(`💬 ${node.data.message}`);
            }
          });

          // Simular condições
          const conditionNodes = currentFlow.nodes
            .filter((node) => node.data.type === "condition")
            .slice(0, 1);

          conditionNodes.forEach((node) => {
            responses.push(`❓ Avaliando: ${node.data.label}`);
          });

          // Simular ações
          const actionNodes = currentFlow.nodes
            .filter((node) => node.data.type === "action")
            .slice(0, 1);

          actionNodes.forEach((node) => {
            responses.push(`⚡ Executando: ${node.data.label}`);
          });

          return responses.length > 0
            ? responses
            : ["Flow executado com sucesso!"];
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        // Função para resetar flows (para debug)
        resetToDefaultFlows: () => {
          set({
            flows: defaultFlows,
            currentFlow: null,
            nodes: [],
            edges: [],
            selectedNodeId: null,
          });
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
