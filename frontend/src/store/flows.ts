import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  Node,
} from "reactflow";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

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
    conditions?: Array<{
      value: string;
      operator: "equals" | "contains" | "regex" | "range";
      target: string;
      label: string;
    }>;
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

  // Auto-connection management for dynamic conditions
  updateNodeConditionsAndEdges: (
    nodeId: string,
    conditions: Array<{
      value: string;
      operator: "equals" | "contains" | "regex" | "range";
      target: string;
      label: string;
    }>
  ) => void;

  // Flow execution
  saveCurrentFlow: () => void;
  testFlow: (startMessage: string) => Promise<string[]>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Função para resetar flows (para debug)
  resetToDefaultFlows: () => void;
  clearCacheAndReload: () => void;
}

// Templates de flows predefinidos
const defaultFlows: ChatFlow[] = [
  {
    id: "0",
    name: "Template Menu Dinâmico",
    description: "Template básico para criar menus de opções personalizados",
    nodes: [
      {
        id: "start-0",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          type: "start",
          label: "Início",
        },
      },
      {
        id: "menu-message",
        type: "custom",
        position: { x: 300, y: 100 },
        data: {
          type: "message",
          label: "Mensagem de Menu",
          message: `Olá! Como posso ajudá-lo hoje?

Por favor, escolha uma das opções:

1️⃣ Opção 1
2️⃣ Opção 2  
3️⃣ Opção 3

Digite o número da opção desejada.`,
        },
      },
      {
        id: "condition-menu",
        type: "custom",
        position: { x: 600, y: 100 },
        data: {
          type: "condition",
          label: "Avaliar Resposta",
          condition: "user_input.trim()",
        },
      },
      // Opção 1
      {
        id: "opcao1-message",
        type: "custom",
        position: { x: 300, y: 300 },
        data: {
          type: "message",
          label: "Resposta Opção 1",
          message: "Você escolheu a Opção 1. Configure esta mensagem!",
        },
      },
      {
        id: "opcao1-action",
        type: "custom",
        position: { x: 300, y: 450 },
        data: {
          type: "action",
          label: "Ação Opção 1",
          action: "custom_action_1",
        },
      },
      // Opção 2
      {
        id: "opcao2-message",
        type: "custom",
        position: { x: 600, y: 300 },
        data: {
          type: "message",
          label: "Resposta Opção 2",
          message: "Você escolheu a Opção 2. Configure esta mensagem!",
        },
      },
      {
        id: "opcao2-action",
        type: "custom",
        position: { x: 600, y: 450 },
        data: {
          type: "action",
          label: "Ação Opção 2",
          action: "custom_action_2",
        },
      },
      // Opção 3
      {
        id: "opcao3-message",
        type: "custom",
        position: { x: 900, y: 300 },
        data: {
          type: "message",
          label: "Resposta Opção 3",
          message: "Você escolheu a Opção 3. Configure esta mensagem!",
        },
      },
      {
        id: "opcao3-action",
        type: "custom",
        position: { x: 900, y: 450 },
        data: {
          type: "action",
          label: "Ação Opção 3",
          action: "custom_action_3",
        },
      },
      // Opção inválida
      {
        id: "invalid-message",
        type: "custom",
        position: { x: 600, y: 600 },
        data: {
          type: "message",
          label: "Opção Inválida",
          message: "Opção inválida. Por favor, digite 1, 2 ou 3.",
        },
      },
    ],
    edges: [
      // Fluxo principal
      {
        id: "e0-1",
        source: "start-0",
        target: "menu-message",
        type: "smoothstep",
      },
      {
        id: "e1-2",
        source: "menu-message",
        target: "condition-menu",
        type: "smoothstep",
      },
      // Condições para cada opção
      {
        id: "e2-opcao1",
        source: "condition-menu",
        target: "opcao1-message",
        type: "smoothstep",
        label: "= 1",
      },
      {
        id: "e2-opcao2",
        source: "condition-menu",
        target: "opcao2-message",
        type: "smoothstep",
        label: "= 2",
      },
      {
        id: "e2-opcao3",
        source: "condition-menu",
        target: "opcao3-message",
        type: "smoothstep",
        label: "= 3",
      },
      {
        id: "e2-invalid",
        source: "condition-menu",
        target: "invalid-message",
        type: "smoothstep",
        label: "Outro",
      },
      // Ações
      {
        id: "e-opcao1-action",
        source: "opcao1-message",
        target: "opcao1-action",
        type: "smoothstep",
      },
      {
        id: "e-opcao2-action",
        source: "opcao2-message",
        target: "opcao2-action",
        type: "smoothstep",
      },
      {
        id: "e-opcao3-action",
        source: "opcao3-message",
        target: "opcao3-action",
        type: "smoothstep",
      },
      // Voltar ao menu em caso de erro
      {
        id: "e-invalid-retry",
        source: "invalid-message",
        target: "menu-message",
        type: "smoothstep",
        label: "Tentar Novamente",
      },
    ],
    isActive: false,
    createdAt: "2025-06-21T08:00:00Z",
    updatedAt: "2025-06-21T08:00:00Z",
    triggers: ["menu", "opções", "ajuda"],
  },
  {
    id: "menu-simples",
    name: "Menu Simples (2 Opções)",
    description:
      "Template básico com apenas 2 opções - ideal para sim/não ou escolhas simples",
    nodes: [
      {
        id: "start-simple",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          type: "start",
          label: "Início",
        },
      },
      {
        id: "question-message",
        type: "custom",
        position: { x: 300, y: 100 },
        data: {
          type: "message",
          label: "Pergunta",
          message: `Gostaria de continuar?

1️⃣ Sim
2️⃣ Não

Digite 1 ou 2:`,
        },
      },
      {
        id: "condition-simple",
        type: "custom",
        position: { x: 600, y: 100 },
        data: {
          type: "condition",
          label: "Avaliar Resposta",
          condition: "user_input.trim()",
        },
      },
      {
        id: "sim-message",
        type: "custom",
        position: { x: 400, y: 300 },
        data: {
          type: "message",
          label: "Resposta Sim",
          message: "Ótimo! Vamos continuar...",
        },
      },
      {
        id: "nao-message",
        type: "custom",
        position: { x: 800, y: 300 },
        data: {
          type: "message",
          label: "Resposta Não",
          message: "Tudo bem! Caso mude de ideia, estou aqui.",
        },
      },
      {
        id: "invalid-simple",
        type: "custom",
        position: { x: 600, y: 450 },
        data: {
          type: "message",
          label: "Opção Inválida",
          message: "Por favor, digite apenas 1 para Sim ou 2 para Não.",
        },
      },
    ],
    edges: [
      {
        id: "e-start-question",
        source: "start-simple",
        target: "question-message",
        type: "smoothstep",
      },
      {
        id: "e-question-condition",
        source: "question-message",
        target: "condition-simple",
        type: "smoothstep",
      },
      {
        id: "e-sim",
        source: "condition-simple",
        target: "sim-message",
        type: "smoothstep",
        label: "= 1",
      },
      {
        id: "e-nao",
        source: "condition-simple",
        target: "nao-message",
        type: "smoothstep",
        label: "= 2",
      },
      {
        id: "e-invalid-simple",
        source: "condition-simple",
        target: "invalid-simple",
        type: "smoothstep",
        label: "Outro",
      },
      {
        id: "e-retry-simple",
        source: "invalid-simple",
        target: "question-message",
        type: "smoothstep",
        label: "Tentar Novamente",
      },
    ],
    isActive: false,
    createdAt: "2025-06-21T08:30:00Z",
    updatedAt: "2025-06-21T08:30:00Z",
    triggers: ["sim", "não", "escolha"],
  },
  {
    id: "2",
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
    id: "3",
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
    id: "4",
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
          set((state) => {
            // Check if source node has dynamic conditions
            const sourceNode = state.nodes.find(
              (n) => n.id === connection.source
            );

            // Create the edge object
            const newEdge = {
              id: `edge-${connection.source}-${
                connection.target
              }-${Date.now()}`,
              source: connection.source!,
              target: connection.target!,
              sourceHandle: connection.sourceHandle,
              targetHandle: connection.targetHandle,
            };

            // If source node has conditions, suggest a label for the edge
            if (
              sourceNode?.data.conditions &&
              sourceNode.data.conditions.length > 0
            ) {
              const firstCondition = sourceNode.data.conditions[0];
              let suggestedLabel = "";

              if (firstCondition.operator === "equals") {
                suggestedLabel = `= ${firstCondition.value}`;
              } else if (firstCondition.operator === "contains") {
                suggestedLabel = `contains ${firstCondition.value}`;
              } else if (firstCondition.operator === "regex") {
                suggestedLabel = `regex ${firstCondition.value}`;
              } else {
                suggestedLabel = `${firstCondition.operator} ${firstCondition.value}`;
              }

              Object.assign(newEdge, {
                label: suggestedLabel,
                type: "default",
                style: { stroke: "#3b82f6" },
                labelStyle: { fontSize: "12px", fontWeight: 500 },
                labelBgStyle: { fill: "#dbeafe" },
              });
            }

            return {
              edges: addEdge(newEdge, state.edges),
            };
          });
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

        // Auto-connection management for dynamic conditions
        updateNodeConditionsAndEdges: (
          nodeId: string,
          conditions: Array<{
            value: string;
            operator: "equals" | "contains" | "regex" | "range";
            target: string;
            label: string;
          }>
        ) => {
          set((state) => {
            // Update node data with new conditions
            const updatedNodes = state.nodes.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, conditions } }
                : node
            );

            // Remove existing edges from this condition node (old conditions)
            const filteredEdges = state.edges.filter(
              (edge) => edge.source !== nodeId
            );

            // Note: We don't auto-create edges here because the user needs to connect
            // them manually to their desired target nodes. This function just updates
            // the node data and cleans up old edges.

            return {
              nodes: updatedNodes,
              edges: filteredEdges,
            };
          });
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
        }, // Função para resetar flows (para debug)
        resetToDefaultFlows: () => {
          set({
            flows: defaultFlows,
            currentFlow: null,
            nodes: [],
            edges: [],
            selectedNodeId: null,
          });
        },

        // Função para limpar cache e recarregar dados
        clearCacheAndReload: () => {
          // Limpar localStorage
          localStorage.removeItem("flows-storage");
          // Recarregar dados padrão
          set({
            flows: defaultFlows,
            currentFlow: null,
            nodes: [],
            edges: [],
            selectedNodeId: null,
            isLoading: false,
            error: null,
          });
        },
      }),
      {
        name: "flows-storage",
        version: 1, // Adicionar versão para invalidar cache antigo
        partialize: (state) => ({ flows: state.flows }),
        onRehydrateStorage: () => (state) => {
          // Log para debug
          console.log("Store rehydrated with:", state?.flows?.length, "flows");
        },
      }
    ),
    {
      name: "flows-store",
    }
  )
);
