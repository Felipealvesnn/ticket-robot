/**
 * ⚙️ Configurações do Sistema de Validação
 * Define regras e limites para validação de fluxos
 */

export interface ValidationConfig {
  // Estrutura
  structure: {
    requireStartNode: boolean;
    allowMultipleStartNodes: boolean;
    requireEndNode: boolean;
    maxOrphanNodes: number;
  };

  // Performance
  performance: {
    maxFlowLength: number;
    maxWebhookSequence: number;
    maxNodesProximity: number;
  };

  // Usabilidade
  usability: {
    maxMessageLength: number;
    maxMenuOptions: number;
    requireWelcomeMessage: boolean;
    maxConsecutiveInputs: number;
  };

  // Conteúdo
  content: {
    allowEmptyMessages: boolean;
    requireVariableNames: boolean;
    validateUrls: boolean;
    checkVariableUsage: boolean;
  };

  // Auto-validação
  autoValidation: {
    enabled: boolean;
    debounceMs: number;
    validateOnSave: boolean;
    blockSaveOnErrors: boolean;
  };
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  structure: {
    requireStartNode: true,
    allowMultipleStartNodes: false,
    requireEndNode: false, // Flexível para diferentes tipos de fluxo
    maxOrphanNodes: 0,
  },

  performance: {
    maxFlowLength: 15, // Máximo de passos no fluxo
    maxWebhookSequence: 3, // Máximo de webhooks consecutivos
    maxNodesProximity: 60, // Distância mínima entre nós
  },

  usability: {
    maxMessageLength: 800, // Limite para mensagens
    maxMenuOptions: 6, // Máximo de opções em menu
    requireWelcomeMessage: true,
    maxConsecutiveInputs: 3, // Máximo de inputs seguidos
  },

  content: {
    allowEmptyMessages: false,
    requireVariableNames: true,
    validateUrls: true,
    checkVariableUsage: true,
  },

  autoValidation: {
    enabled: true,
    debounceMs: 1000,
    validateOnSave: true,
    blockSaveOnErrors: true,
  },
};

/**
 * 🎯 Configurações por tipo de projeto
 */
export const VALIDATION_PRESETS = {
  // Para atendimento ao cliente
  customer_service: {
    ...DEFAULT_VALIDATION_CONFIG,
    usability: {
      ...DEFAULT_VALIDATION_CONFIG.usability,
      maxMessageLength: 500, // Mensagens mais concisas
      maxMenuOptions: 4, // Menos opções para simplificar
      requireWelcomeMessage: true,
    },
    performance: {
      ...DEFAULT_VALIDATION_CONFIG.performance,
      maxFlowLength: 10, // Fluxos mais diretos
    },
  },

  // Para pesquisas e formulários
  survey_form: {
    ...DEFAULT_VALIDATION_CONFIG,
    usability: {
      ...DEFAULT_VALIDATION_CONFIG.usability,
      maxConsecutiveInputs: 5, // Mais inputs permitidos
      requireWelcomeMessage: true,
    },
    structure: {
      ...DEFAULT_VALIDATION_CONFIG.structure,
      requireEndNode: true, // Pesquisas devem ter fim definido
    },
  },

  // Para vendas e marketing
  sales_marketing: {
    ...DEFAULT_VALIDATION_CONFIG,
    usability: {
      ...DEFAULT_VALIDATION_CONFIG.usability,
      maxMessageLength: 600,
      maxMenuOptions: 8, // Mais opções de produtos/serviços
    },
    performance: {
      ...DEFAULT_VALIDATION_CONFIG.performance,
      maxFlowLength: 20, // Fluxos de venda podem ser mais longos
    },
  },

  // Para desenvolvimento/teste
  development: {
    ...DEFAULT_VALIDATION_CONFIG,
    autoValidation: {
      ...DEFAULT_VALIDATION_CONFIG.autoValidation,
      blockSaveOnErrors: false, // Permite salvar com erros durante desenvolvimento
    },
    structure: {
      ...DEFAULT_VALIDATION_CONFIG.structure,
      requireStartNode: false, // Mais flexível para testes
    },
  },
} as const;

/**
 * 📋 Níveis de severidade para validação
 */
export enum ValidationSeverity {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

/**
 * 🏷️ Categorias de validação
 */
export enum ValidationCategory {
  STRUCTURE = "structure",
  CONFIGURATION = "configuration",
  PERFORMANCE = "performance",
  USABILITY = "usability",
  CONTENT = "content",
  BEST_PRACTICES = "best_practices",
}

/**
 * 📜 Templates de mensagens de validação
 */
export const VALIDATION_MESSAGES = {
  structure: {
    no_start_node: {
      title: "Sem ponto de entrada",
      description: 'Todo fluxo precisa ter um nó "Início"',
      suggestion: 'Adicione um nó "Início" ao fluxo',
    },
    multiple_start_nodes: {
      title: "Múltiplos pontos de entrada",
      description: 'Um fluxo deve ter apenas um nó "Início"',
      suggestion: 'Remova os nós "Início" extras',
    },
    orphan_node: {
      title: "Nó desconectado",
      description: "O nó não está conectado ao fluxo",
      suggestion: "Conecte este nó ao fluxo principal",
    },
  },

  performance: {
    flow_too_long: {
      title: "Fluxo muito longo",
      description: "O fluxo pode ser complexo demais para o usuário",
      suggestion: "Considere dividir em subfluxos menores",
    },
    too_many_webhooks: {
      title: "Muitos webhooks consecutivos",
      description: "Múltiplos webhooks podem causar lentidão",
      suggestion: "Considere combinar as chamadas em um único webhook",
    },
  },

  usability: {
    message_too_long: {
      title: "Mensagem muito longa",
      description: "Mensagens longas podem ser difíceis de ler no mobile",
      suggestion: "Divida em mensagens menores ou use formatação",
    },
    too_many_menu_options: {
      title: "Menu com muitas opções",
      description: "Menus com muitas opções podem confundir o usuário",
      suggestion: "Agrupe opções relacionadas ou divida em submenus",
    },
  },
} as const;
