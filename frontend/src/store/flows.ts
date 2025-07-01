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
import { flowApiService } from "../services/flowApi";

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
  type:
    | "start"
    | "message"
    | "condition"
    | "action"
    | "end"
    | "delay"
    | "image"
    | "file"
    | "webhook"
    | "database"
    | "calculation"
    | "email"
    | "phone"
    | "automation"
    | "segment"
    | "tag"
    | "transfer"
    | "ticket";
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
    awaitInput?: boolean; // Se deve aguardar entrada do usuário (padrão: true para nós message)
  };
  position: { x: number; y: number };
}

interface FlowsState {
  // Estado
  flows: ChatFlow[];
  currentFlow: ChatFlow | null;

  // API estado
  isLoading: boolean;
  isSaving: boolean;
  apiError: string | null;
  uploadProgress: { [nodeId: string]: number }; // Progresso de upload por node

  // Editor state
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null; // Ações
  createFlow: (name: string, description: string) => ChatFlow;
  updateFlow: (id: string, updates: Partial<ChatFlow>) => void;
  deleteFlow: (id: string) => void;
  duplicateFlow: (id: string) => void;
  setCurrentFlow: (flow: ChatFlow | null) => void;
  // Editor actions
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: FlowNode["type"], position: { x: number; y: number }) => void;
  addNodeWithConnection: (
    type: FlowNode["type"],
    position: { x: number; y: number },
    sourceNodeId: string,
    edgeLabel?: string
  ) => string; // Retorna o ID do novo nó
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
  saveCurrentFlow: () => Promise<void>;
  testFlow: (startMessage: string) => Promise<string[]>;

  // API Integration
  loadFlowsFromApi: () => Promise<void>;
  saveFlowToApi: (flowId?: string) => Promise<ChatFlow>;
  syncWithApi: () => Promise<void>;

  // Debug functions
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
          conditions: [
            {
              id: "cond-1",
              field: "message",
              value: "1",
              operator: "equals",
              label: "Opção 1",
            },
            {
              id: "cond-2",
              field: "message",
              value: "2",
              operator: "equals",
              label: "Opção 2",
            },
            {
              id: "cond-3",
              field: "message",
              value: "3",
              operator: "equals",
              label: "Opção 3",
            },
          ],
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
];

export const useFlowsStore = create<FlowsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        flows: defaultFlows,
        currentFlow: null,
        // Editor state
        nodes: [],
        edges: [],
        selectedNodeId: null,

        // API state
        isLoading: false,
        isSaving: false,
        apiError: null,
        uploadProgress: {},

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
          return newFlow;
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
          const getNodeLabel = (nodeType: string) => {
            const labels = {
              start: "Início",
              message: "Mensagem de Texto",
              condition: "Condição",
              delay: "Aguardar",
              image: "Imagem",
              file: "Arquivo",
              end: "Fim",
              webhook: "Webhook",
              database: "Banco de Dados",
              calculation: "Calcular",
              email: "Enviar Email",
              phone: "Fazer Ligação",
              automation: "Automação",
              segment: "Segmentar",
              tag: "Adicionar Tag",
              transfer: "Falar com Atendente",
              ticket: "Criar Ticket",
            };
            return labels[nodeType as keyof typeof labels] || "Nó";
          };

          const newNode: Node = {
            id: `${type}-${Date.now()}`,
            type: "custom", // Usar sempre o tipo custom
            position,
            data: {
              type, // Adicionar o tipo no data
              label: getNodeLabel(type),
              message:
                type === "message" ? "Digite sua mensagem aqui..." : undefined,
              condition:
                type === "condition" ? "user_input == 'sim'" : undefined,
              conditions: type === "condition" ? [] : undefined,
              action: type === "action" ? "send_to_human" : undefined,
              delay: type === "delay" ? 5 : undefined,
            },
          };

          set((state) => ({
            nodes: [...state.nodes, newNode],
            selectedNodeId: newNode.id,
          }));
        },
        addNodeWithConnection: (type, position, sourceNodeId, edgeLabel) => {
          const getNodeLabel = (nodeType: string) => {
            const labels = {
              start: "Início",
              message: "Mensagem de Texto",
              condition: "Condição",
              delay: "Aguardar",
              image: "Imagem",
              file: "Arquivo",
              end: "Fim",
              webhook: "Webhook",
              database: "Banco de Dados",
              calculation: "Calcular",
              email: "Enviar Email",
              phone: "Fazer Ligação",
              automation: "Automação",
              segment: "Segmentar",
              tag: "Adicionar Tag",
              transfer: "Falar com Atendente",
              ticket: "Criar Ticket",
            };
            return labels[nodeType as keyof typeof labels] || "Nó";
          };

          const newNodeId = `${type}-${Date.now()}`;
          const newNode: Node = {
            id: newNodeId,
            type: "custom",
            position,
            data: {
              type,
              label: getNodeLabel(type),
              message:
                type === "message" ? "Digite sua resposta aqui..." : undefined,
              condition:
                type === "condition" ? "user_input == 'sim'" : undefined,
              conditions: type === "condition" ? [] : undefined,
              action: type === "action" ? "send_to_human" : undefined,
              delay: type === "delay" ? 5 : undefined,
            },
          };

          const newEdge: Edge = {
            id: `edge-${sourceNodeId}-${newNodeId}`,
            source: sourceNodeId,
            target: newNodeId,
            type: "smoothstep",
            label: edgeLabel,
          };

          set((state) => ({
            nodes: [...state.nodes, newNode],
            edges: [...state.edges, newEdge],
            selectedNodeId: newNodeId,
          }));

          return newNodeId;
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
        saveCurrentFlow: async () => {
          const { currentFlow } = get();
          if (!currentFlow) {
            console.warn("⚠️ Nenhum flow atual para salvar");
            return;
          }

          try {
            // Se é um flow da API (não é template), salvar na API
            if (
              currentFlow.id !== "0" &&
              !currentFlow.id.startsWith("template-")
            ) {
              await get().saveFlowToApi(currentFlow.id);
              console.log("✅ Flow salvo na API com sucesso");
            } else {
              // Para templates, apenas atualizar localmente
              const { nodes, edges, updateFlow } = get();
              updateFlow(currentFlow.id, {
                nodes,
                edges,
                updatedAt: new Date().toISOString(),
              });
              console.log(
                `✅ Template "${currentFlow.name}" atualizado localmente`
              );
            }
          } catch (error) {
            console.error("❌ Erro ao salvar flow:", error);
            throw error;
          }
        },

        testFlow: async (startMessage: string) => {
          const { currentFlow } = get();

          if (!currentFlow) return ["Nenhum flow selecionado"];
          console.log("Iniciando teste do flow:", currentFlow);
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

        // ===== API INTEGRATION =====

        /**
         * 📥 Carregar flows da API
         */
        loadFlowsFromApi: async () => {
          try {
            set({ isLoading: true, apiError: null });

            const apiFlows = await flowApiService.loadFlowsFromApi();

            // Merge com flows locais (templates)
            const mergedFlows = [
              ...defaultFlows, // Templates sempre disponíveis
              ...apiFlows.filter((flow) => flow.id !== "0"), // Flows da API (exceto templates)
            ];

            set({
              flows: mergedFlows,
              isLoading: false,
            });

            console.log(`✅ ${apiFlows.length} flows carregados da API`);
          } catch (error) {
            console.error("❌ Erro ao carregar flows da API:", error);
            set({
              apiError:
                error instanceof Error ? error.message : "Erro desconhecido",
              isLoading: false,
            });
          }
        },

        /**
         * 💾 Salvar flow atual na API
         */
        saveFlowToApi: async (flowId?: string) => {
          try {
            set({ isSaving: true, apiError: null });

            const { currentFlow } = get();
            if (!currentFlow) {
              throw new Error("Nenhum flow selecionado para salvar");
            }

            // Usar o flowId fornecido ou o ID do flow atual
            const targetFlowId = flowId || currentFlow.id;
            const targetFlow = get().flows.find((f) => f.id === targetFlowId);

            if (!targetFlow) {
              throw new Error("Flow não encontrado");
            }

            // Atualizar o flow com os nodes/edges atuais
            const updatedFlow: ChatFlow = {
              ...targetFlow,
              nodes: get().nodes,
              edges: get().edges,
              updatedAt: new Date().toISOString(),
            };

            // Salvar na API
            const savedFlow = await flowApiService.saveFlow(updatedFlow);
            const parsedFlow = flowApiService.parseFlowResponse(savedFlow);

            // Atualizar estado local
            const updatedFlows = get().flows.map((f) =>
              f.id === targetFlow.id ? parsedFlow : f
            );

            // Se é um novo flow (era template), adicionar à lista
            if (
              targetFlow.id === "0" ||
              targetFlow.id.startsWith("template-")
            ) {
              updatedFlows.push(parsedFlow);
            }

            set({
              flows: updatedFlows,
              currentFlow: parsedFlow,
              isSaving: false,
            });

            console.log(`✅ Flow "${parsedFlow.name}" salvo com sucesso`);
            return parsedFlow;
          } catch (error) {
            console.error("❌ Erro ao salvar flow:", error);
            set({
              apiError:
                error instanceof Error ? error.message : "Erro ao salvar",
              isSaving: false,
            });
            throw error;
          }
        },

        /**
         * 🔄 Sincronizar com API (load + save se necessário)
         */
        syncWithApi: async () => {
          try {
            // Primeiro carrega da API
            await get().loadFlowsFromApi();

            // Se há mudanças locais não salvas, pode alertar o usuário
            // Por enquanto, apenas carrega da API
            console.log("✅ Sincronização concluída");
          } catch (error) {
            console.error("❌ Erro na sincronização:", error);
            throw error;
          }
        },

        // Debug functions
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
