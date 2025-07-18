/**
 * 🔍 Sistema de Validação de Fluxos
 * Detecta problemas e inconsistências antes de salvar
 */

import {
  DEFAULT_VALIDATION_CONFIG,
  ValidationConfig,
} from "./ValidationConfig";

export interface ValidationError {
  id: string;
  type: "error" | "warning" | "info";
  nodeId?: string;
  message: string;
  description?: string;
  suggestion?: string;
  category?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    canSave: boolean;
    lastValidated: Date;
  };
}

export class FlowValidator {
  private nodes: any[];
  private edges: any[];
  private config: ValidationConfig;

  constructor(
    nodes: any[],
    edges: any[],
    config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.config = config;
  }

  /**
   * 🎯 Validação principal do fluxo
   */
  validateFlow(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // 1. Validações críticas (ERRORS)
    errors.push(...this.validateStructure());
    errors.push(...this.validateNodeConfiguration());
    errors.push(...this.validateVariables());
    errors.push(...this.validateConnections());

    // 2. Validações de boas práticas (WARNINGS)
    warnings.push(...this.validateBestPractices());
    warnings.push(...this.validatePerformance());
    warnings.push(...this.validateUsability());

    // 3. Informações úteis (INFO)
    info.push(...this.generateFlowInsights());

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      summary: {
        totalIssues: errors.length + warnings.length,
        criticalIssues: errors.length,
        canSave: errors.length === 0,
        lastValidated: new Date(),
      },
    };
  }

  /**
   * 🏗️ Validar estrutura básica do fluxo
   */
  private validateStructure(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Verificar se há pelo menos um nó
    if (this.nodes.length === 0) {
      errors.push({
        id: "no-nodes",
        type: "error",
        message: "Fluxo vazio",
        description: "O fluxo precisa ter pelo menos um nó",
        suggestion: 'Adicione um nó "Início" para começar',
        category: "structure",
      });
      return errors;
    }

    // Verificar se há nó de início (se obrigatório)
    if (this.config.structure.requireStartNode) {
      const startNodes = this.nodes.filter((n) => n.data?.type === "start");
      if (startNodes.length === 0) {
        errors.push({
          id: "no-start",
          type: "error",
          message: "Sem ponto de entrada",
          description: 'Todo fluxo precisa ter um nó "Início"',
          suggestion: 'Adicione um nó "Início" ao fluxo',
          category: "structure",
        });
      } else if (
        !this.config.structure.allowMultipleStartNodes &&
        startNodes.length > 1
      ) {
        errors.push({
          id: "multiple-starts",
          type: "error",
          message: "Múltiplos pontos de entrada",
          description: 'Um fluxo deve ter apenas um nó "Início"',
          suggestion: 'Remova os nós "Início" extras',
          category: "structure",
        });
      }
    }

    // Verificar nós órfãos (sem conexões)
    const orphanNodes = this.findOrphanNodes();
    if (orphanNodes.length > this.config.structure.maxOrphanNodes) {
      orphanNodes.forEach((node) => {
        errors.push({
          id: `orphan-${node.id}`,
          type: "error",
          nodeId: node.id,
          message: "Nó desconectado",
          description: `O nó "${
            node.data?.label || node.data?.type
          }" não está conectado ao fluxo`,
          suggestion: "Conecte este nó ao fluxo principal",
          category: "structure",
        });
      });
    }

    // Verificar nós sem saída (exceto end nodes)
    const deadEndNodes = this.findDeadEndNodes();
    deadEndNodes.forEach((node) => {
      errors.push({
        id: `dead-end-${node.id}`,
        type: "error",
        nodeId: node.id,
        message: "Nó sem continuação",
        description: `O nó "${
          node.data?.label || node.data?.type
        }" não tem próximo passo`,
        suggestion: 'Adicione uma conexão ou transforme em nó "Fim"',
        category: "structure",
      });
    });

    return errors;
  }

  /**
   * ⚙️ Validar configuração dos nós
   */
  private validateNodeConfiguration(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.nodes.forEach((node) => {
      const nodeType = node.data?.type;
      const nodeLabel = node.data?.label || nodeType;

      switch (nodeType) {
        case "message":
          if (!node.data?.message?.trim()) {
            errors.push({
              id: `message-empty-${node.id}`,
              type: "error",
              nodeId: node.id,
              message: "Mensagem vazia",
              description: `O nó "${nodeLabel}" não tem conteúdo`,
              suggestion: 'Digite uma mensagem na aba "Básico"',
            });
          }
          break;

        case "input":
          if (!node.data?.message?.trim()) {
            errors.push({
              id: `input-no-prompt-${node.id}`,
              type: "error",
              nodeId: node.id,
              message: "Prompt obrigatório",
              description: `O nó de input "${nodeLabel}" precisa de uma pergunta`,
              suggestion: 'Configure a mensagem de prompt na aba "Básico"',
            });
          }
          if (!node.data?.variableName?.trim()) {
            errors.push({
              id: `input-no-variable-${node.id}`,
              type: "error",
              nodeId: node.id,
              message: "Nome da variável obrigatório",
              description: `O nó de input "${nodeLabel}" precisa salvar em uma variável`,
              suggestion: 'Configure o nome da variável na aba "Configuração"',
            });
          }
          break;

        case "condition":
          if (!node.data?.conditions || node.data.conditions.length === 0) {
            errors.push({
              id: `condition-no-rules-${node.id}`,
              type: "error",
              nodeId: node.id,
              message: "Sem condições definidas",
              description: `O nó de decisão "${nodeLabel}" não tem regras`,
              suggestion: 'Adicione condições na aba "Condições"',
            });
          } else {
            // Validar cada condição
            node.data.conditions.forEach((condition: any, index: number) => {
              if (!condition.field?.trim()) {
                errors.push({
                  id: `condition-no-field-${node.id}-${index}`,
                  type: "error",
                  nodeId: node.id,
                  message: "Campo não selecionado",
                  description: `Condição ${index + 1} não tem campo definido`,
                  suggestion: "Selecione um campo para comparar",
                });
              }
              if (!condition.value?.trim()) {
                errors.push({
                  id: `condition-no-value-${node.id}-${index}`,
                  type: "error",
                  nodeId: node.id,
                  message: "Valor não definido",
                  description: `Condição ${
                    index + 1
                  } não tem valor para comparar`,
                  suggestion: "Digite um valor para comparação",
                });
              }
            });
          }
          break;

        case "menu":
        case "mainMenu":
          // Validar mensagem do menu
          if (!node.data?.message?.trim() && !node.data?.label?.trim()) {
            errors.push({
              id: `menu-no-message-${node.id}`,
              type: "error",
              nodeId: node.id,
              message: "Menu sem mensagem",
              description: `O nó menu "${nodeLabel}" precisa de uma mensagem ou título`,
              suggestion: 'Configure a mensagem na aba "Básico"',
            });
          }

          // Validar opções do menu
          if (
            !node.data?.options ||
            !Array.isArray(node.data.options) ||
            node.data.options.length === 0
          ) {
            errors.push({
              id: `menu-no-options-${node.id}`,
              type: "error",
              nodeId: node.id,
              message: "Menu sem opções",
              description: `O nó menu "${nodeLabel}" não tem opções configuradas`,
              suggestion: 'Adicione opções na aba "Menu"',
            });
          } else {
            // Validar cada opção do menu
            node.data.options.forEach((option: any, index: number) => {
              if (!option.key?.trim()) {
                errors.push({
                  id: `menu-option-no-key-${node.id}-${index}`,
                  type: "error",
                  nodeId: node.id,
                  message: "Opção sem chave",
                  description: `Opção ${
                    index + 1
                  } do menu não tem chave definida`,
                  suggestion:
                    "Digite uma chave para a opção (ex: 1, A, opcao1)",
                });
              }
              if (!option.text?.trim()) {
                errors.push({
                  id: `menu-option-no-text-${node.id}-${index}`,
                  type: "error",
                  nodeId: node.id,
                  message: "Opção sem texto",
                  description: `Opção ${
                    index + 1
                  } do menu não tem texto explicativo`,
                  suggestion: "Digite um texto descritivo para a opção",
                });
              }

              // Verificar se a chave é única dentro do menu
              const duplicateKeys = node.data.options.filter(
                (opt: any, i: number) => i !== index && opt.key === option.key
              );
              if (duplicateKeys.length > 0) {
                errors.push({
                  id: `menu-duplicate-key-${node.id}-${index}`,
                  type: "error",
                  nodeId: node.id,
                  message: "Chave duplicada",
                  description: `A chave "${option.key}" está sendo usada em múltiplas opções`,
                  suggestion: "Use chaves únicas para cada opção do menu",
                });
              }
            });

            // Verificar se há muitas opções (UX)
            if (
              node.data.options.length > this.config.usability.maxMenuOptions
            ) {
              errors.push({
                id: `menu-too-many-options-${node.id}`,
                type: "warning",
                nodeId: node.id,
                message: "Muitas opções no menu",
                description: `Menu com ${node.data.options.length} opções pode confundir o usuário`,
                suggestion: "Considere dividir em submenus ou reduzir opções",
                category: "usability",
              });
            }
          }

          // Validar se menu principal está marcado corretamente
          if (node.data?.type === "mainMenu" && !node.data?.isMainMenu) {
            errors.push({
              id: `main-menu-not-marked-${node.id}`,
              type: "warning",
              nodeId: node.id,
              message: "Menu principal não marcado",
              description: "Nó do tipo 'mainMenu' deve ter isMainMenu = true",
              suggestion: "Marque como menu principal nas configurações",
              category: "configuration",
            });
          }
          break;

        case "webhook":
          if (!node.data?.webhookUrl?.trim()) {
            errors.push({
              id: `webhook-no-url-${node.id}`,
              type: "error",
              nodeId: node.id,
              message: "URL do webhook obrigatória",
              description: `O nó webhook "${nodeLabel}" não tem URL configurada`,
              suggestion: 'Configure a URL na aba "Integração"',
            });
          } else {
            // Validar formato da URL
            try {
              new URL(node.data.webhookUrl);
            } catch {
              errors.push({
                id: `webhook-invalid-url-${node.id}`,
                type: "error",
                nodeId: node.id,
                message: "URL inválida",
                description: `A URL "${node.data.webhookUrl}" não é válida`,
                suggestion:
                  "Verifique o formato da URL (ex: https://api.exemplo.com)",
              });
            }
          }
          break;
      }
    });

    return errors;
  }

  /**
   * 📦 Validar uso de variáveis
   */
  private validateVariables(): ValidationError[] {
    const errors: ValidationError[] = [];
    const definedVariables = new Set<string>();
    const usedVariables = new Set<string>();

    // Mapear variáveis definidas
    this.nodes.forEach((node) => {
      if (node.data?.type === "input" && node.data?.variableName) {
        definedVariables.add(node.data.variableName);
      }
      if (node.data?.type === "webhook" && node.data?.responseVariable) {
        definedVariables.add(node.data.responseVariable);
      }
    });

    // Mapear variáveis usadas
    this.nodes.forEach((node) => {
      if (node.data?.type === "condition" && node.data?.conditions) {
        node.data.conditions.forEach((condition: any) => {
          if (
            condition.field &&
            !["message", "user_message", "lastUserMessage"].includes(
              condition.field
            )
          ) {
            usedVariables.add(condition.field);
          }
        });
      }
      if (node.data?.type === "webhook" && node.data?.customPayload) {
        const matches = node.data.customPayload.match(/\{\{(\w+)\}\}/g);
        if (matches) {
          matches.forEach((match: string) => {
            const varName = match.replace(/\{\{|\}\}/g, "");
            usedVariables.add(varName);
          });
        }
      }
    });

    // Verificar variáveis usadas mas não definidas
    usedVariables.forEach((varName) => {
      if (!definedVariables.has(varName)) {
        errors.push({
          id: `undefined-variable-${varName}`,
          type: "error",
          message: "Variável não definida",
          description: `A variável "${varName}" é usada mas nunca foi definida`,
          suggestion: "Crie um nó de input para capturar esta variável",
        });
      }
    });

    return errors;
  }

  /**
   * 🔗 Validar conexões entre nós
   */
  private validateConnections(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Verificar nós de condição com conexões suficientes
    this.nodes.forEach((node) => {
      if (node.data?.type === "condition") {
        const outgoingEdges = this.edges.filter((e) => e.source === node.id);
        const conditions = node.data?.conditions || [];

        // Precisa ter pelo menos uma conexão para cada condição + uma para "caso contrário"
        if (outgoingEdges.length < conditions.length) {
          errors.push({
            id: `condition-missing-paths-${node.id}`,
            type: "error",
            nodeId: node.id,
            message: "Conexões insuficientes",
            description:
              "Nó de condição precisa de conexão para cada resultado possível",
            suggestion: "Conecte todas as saídas possíveis da condição",
          });
        }
      }

      // Verificar menu com opções conectadas
      if (node.data?.type === "menu") {
        const outgoingEdges = this.edges.filter((e) => e.source === node.id);
        const menuOptions = node.data?.options || [];

        if (outgoingEdges.length < menuOptions.length) {
          errors.push({
            id: `menu-missing-connections-${node.id}`,
            type: "error",
            nodeId: node.id,
            message: "Opções de menu sem destino",
            description: "Todas as opções do menu precisam estar conectadas",
            suggestion: "Conecte cada opção do menu a um próximo passo",
          });
        }
      }
    });

    // Verificar loops infinitos
    const loops = this.detectCycles();
    loops.forEach((loop) => {
      errors.push({
        id: `infinite-loop-${loop.join("-")}`,
        type: "error",
        message: "Loop infinito detectado",
        description: `Ciclo encontrado entre os nós: ${loop.join(" → ")}`,
        suggestion:
          "Adicione uma condição de parada ou remova a conexão circular",
      });
    });

    return errors;
  }

  /**
   * 📋 Validar boas práticas
   */
  private validateBestPractices(): ValidationError[] {
    const warnings: ValidationError[] = [];

    // 🚨 NOVO: Verificar múltiplos nós de menu
    const menuNodes = this.nodes.filter(
      (node) => node.data?.type === "menu" || node.data?.type === "mainMenu"
    );

    if (menuNodes.length > 1) {
      // Verificar se há lógica para retornar ao menu principal
      const hasMenuLogic = this.validateMenuReturnLogic(menuNodes);

      if (!hasMenuLogic) {
        warnings.push({
          id: "multiple-menus-no-logic",
          type: "warning",
          message: "Múltiplos menus sem lógica de retorno",
          description: `${menuNodes.length} menus encontrados, mas sem lógica para retornar ao menu principal quando não há próximo passo`,
          suggestion:
            "Configure um menu como principal e adicione lógica de fallback para retornar a ele",
          category: "navigation",
        });
      }
    }

    // 🚨 NOVO: Verificar nós sem saída que não são finais
    warnings.push(...this.validateNodeExitPaths());

    // Verificar nós muito próximos
    this.nodes.forEach((node) => {
      const closeNodes = this.nodes.filter(
        (other) =>
          other.id !== node.id &&
          Math.abs(other.position.x - node.position.x) < 50 &&
          Math.abs(other.position.y - node.position.y) < 50
      );

      if (closeNodes.length > 0) {
        warnings.push({
          id: `nodes-too-close-${node.id}`,
          type: "warning",
          nodeId: node.id,
          message: "Nós muito próximos",
          description: "Nós próximos podem dificultar a visualização",
          suggestion: "Organize melhor o layout do fluxo",
        });
      }
    });

    // Verificar fluxos muito longos sem fim
    const pathLength = this.calculateLongestPath();
    if (pathLength > 10) {
      warnings.push({
        id: "flow-too-long",
        type: "warning",
        message: "Fluxo muito longo",
        description: `O fluxo tem ${pathLength} passos, pode ser complexo demais`,
        suggestion: "Considere dividir em subfluxos menores",
      });
    }

    // Verificar condições sem else
    this.nodes.forEach((node) => {
      if (
        node.data?.type === "condition" &&
        node.data?.conditions?.length === 1
      ) {
        warnings.push({
          id: `condition-no-else-${node.id}`,
          type: "warning",
          nodeId: node.id,
          message: "Condição sem alternativa",
          description: "Condição com apenas uma opção pode travar o fluxo",
          suggestion: 'Adicione uma condição "caso contrário"',
        });
      }
    });

    // Verificar nós de input consecutivos
    this.edges.forEach((edge) => {
      const sourceNode = this.nodes.find((n) => n.id === edge.source);
      const targetNode = this.nodes.find((n) => n.id === edge.target);

      if (
        sourceNode?.data?.type === "input" &&
        targetNode?.data?.type === "input"
      ) {
        warnings.push({
          id: `consecutive-inputs-${edge.source}-${edge.target}`,
          type: "warning",
          nodeId: edge.source,
          message: "Inputs consecutivos",
          description: "Múltiplas perguntas seguidas podem cansar o usuário",
          suggestion:
            "Considere agrupar perguntas ou adicionar mensagens explicativas",
        });
      }
    });

    return warnings;
  }

  /**
   * 🎯 Validar usabilidade
   */
  private validateUsability(): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Verificar mensagens muito longas
    this.nodes.forEach((node) => {
      if (
        node.data?.message &&
        node.data.message.length > this.config.usability.maxMessageLength
      ) {
        warnings.push({
          id: `message-too-long-${node.id}`,
          type: "warning",
          nodeId: node.id,
          message: "Mensagem muito longa",
          description: `Mensagem com ${node.data.message.length} caracteres (máximo recomendado: ${this.config.usability.maxMessageLength})`,
          suggestion: "Divida em mensagens menores ou use formatação",
          category: "usability",
        });
      }
    });

    // Verificar menu com muitas opções
    this.nodes.forEach((node) => {
      if (
        node.data?.type === "menu" &&
        node.data?.options?.length > this.config.usability.maxMenuOptions
      ) {
        warnings.push({
          id: `menu-too-many-options-${node.id}`,
          type: "warning",
          nodeId: node.id,
          message: "Menu com muitas opções",
          description: `Menu com ${node.data.options.length} opções (máximo recomendado: ${this.config.usability.maxMenuOptions})`,
          suggestion: "Agrupe opções relacionadas ou divida em submenus",
          category: "usability",
        });
      }
    });

    // Verificar falta de mensagens de boas-vindas (se obrigatório)
    if (this.config.usability.requireWelcomeMessage) {
      const startNode = this.nodes.find((n) => n.data?.type === "start");
      if (startNode) {
        const firstConnections = this.edges.filter(
          (e) => e.source === startNode.id
        );
        const hasWelcomeMessage = firstConnections.some((edge) => {
          const targetNode = this.nodes.find((n) => n.id === edge.target);
          return targetNode?.data?.type === "message";
        });

        if (!hasWelcomeMessage) {
          warnings.push({
            id: "no-welcome-message",
            type: "warning",
            nodeId: startNode.id,
            message: "Sem mensagem de boas-vindas",
            description:
              "É recomendado começar com uma mensagem de boas-vindas",
            suggestion:
              "Adicione uma mensagem explicando o que o bot pode fazer",
            category: "usability",
          });
        }
      }
    }

    // Verificar inputs consecutivos
    let consecutiveInputs = 0;
    const inputSequences: string[] = [];

    this.edges.forEach((edge) => {
      const sourceNode = this.nodes.find((n) => n.id === edge.source);
      const targetNode = this.nodes.find((n) => n.id === edge.target);

      if (
        sourceNode?.data?.type === "input" &&
        targetNode?.data?.type === "input"
      ) {
        consecutiveInputs++;
        inputSequences.push(`${edge.source}-${edge.target}`);

        if (consecutiveInputs >= this.config.usability.maxConsecutiveInputs) {
          warnings.push({
            id: `too-many-consecutive-inputs-${edge.source}`,
            type: "warning",
            nodeId: edge.source,
            message: "Muitos inputs consecutivos",
            description: `${
              consecutiveInputs + 1
            } perguntas seguidas podem cansar o usuário`,
            suggestion:
              "Considere agrupar perguntas ou adicionar mensagens explicativas",
            category: "usability",
          });
        }
      } else {
        consecutiveInputs = 0;
      }
    });

    return warnings;
  }

  /**
   * ⚡ Validar performance
   */
  private validatePerformance(): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Verificar muitos webhooks em sequência
    let webhookSequence = 0;
    this.nodes.forEach((node) => {
      if (node.data?.type === "webhook") {
        webhookSequence++;
      } else {
        if (webhookSequence > 2) {
          warnings.push({
            id: `too-many-webhooks-${node.id}`,
            type: "warning",
            message: "Muitos webhooks consecutivos",
            description: "Múltiplos webhooks podem causar lentidão",
            suggestion: "Considere combinar as chamadas em um único webhook",
          });
        }
        webhookSequence = 0;
      }
    });

    return warnings;
  }

  /**
   * 💡 Gerar insights do fluxo
   */
  private generateFlowInsights(): ValidationError[] {
    const insights: ValidationError[] = [];

    insights.push({
      id: "flow-stats",
      type: "info",
      message: "Estatísticas do fluxo",
      description: `${this.nodes.length} nós, ${this.edges.length} conexões`,
    });

    const inputNodes = this.nodes.filter(
      (n) => n.data?.type === "input"
    ).length;
    if (inputNodes > 0) {
      insights.push({
        id: "data-collection",
        type: "info",
        message: "Coleta de dados",
        description: `O fluxo coleta ${inputNodes} tipo(s) de dados do usuário`,
      });
    }

    return insights;
  }

  /**
   * 🔍 Encontrar nós órfãos
   */
  private findOrphanNodes(): any[] {
    const connectedNodes = new Set();

    this.edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    return this.nodes.filter((node) => !connectedNodes.has(node.id));
  }

  /**
   * ⚰️ Encontrar nós sem saída
   */
  private findDeadEndNodes(): any[] {
    const nodesWithOutput = new Set();

    this.edges.forEach((edge) => {
      nodesWithOutput.add(edge.source);
    });

    return this.nodes.filter(
      (node) =>
        !nodesWithOutput.has(node.id) &&
        node.data?.type !== "end" &&
        node.data?.type !== "transfer" &&
        node.data?.type !== "ticket"
    );
  }

  /**
   * 📏 Calcular caminho mais longo
   */
  private calculateLongestPath(): number {
    // Implementação simplificada - pode ser melhorada com algoritmo de grafos
    const startNode = this.nodes.find((n) => n.data?.type === "start");
    if (!startNode) return 0;

    const visited = new Set();
    const dfs = (nodeId: string): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const outgoingEdges = this.edges.filter((e) => e.source === nodeId);
      if (outgoingEdges.length === 0) return 1;

      return 1 + Math.max(...outgoingEdges.map((e) => dfs(e.target)));
    };

    return dfs(startNode.id);
  }

  /**
   * 🔄 Detectar ciclos no fluxo
   */
  private detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    const dfs = (nodeId: string): void => {
      if (recursionStack.has(nodeId)) {
        // Encontrou um ciclo
        const cycleStart = currentPath.indexOf(nodeId);
        if (cycleStart !== -1) {
          cycles.push([...currentPath.slice(cycleStart), nodeId]);
        }
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);
      currentPath.push(nodeId);

      const outgoingEdges = this.edges.filter((e) => e.source === nodeId);
      outgoingEdges.forEach((edge) => {
        dfs(edge.target);
      });

      recursionStack.delete(nodeId);
      currentPath.pop();
    };

    // Executar DFS para cada nó não visitado
    this.nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    });

    return cycles;
  }

  /**
   * 🍽️ Validar lógica de retorno para menus
   */
  private validateMenuReturnLogic(menuNodes: any[]): boolean {
    // Verificar se há um menu principal definido
    const mainMenu = menuNodes.find(
      (node) => node.data?.type === "mainMenu" || node.data?.isMainMenu
    );

    if (!mainMenu) {
      return false;
    }

    // Verificar se nós sem saída podem retornar ao menu principal
    const deadEndNodes = this.findDeadEndNodes();
    const hasReturnPath = deadEndNodes.every((deadNode) => {
      // Para cada nó sem saída, verificar se existe um caminho possível de volta ao menu
      return this.canReachNode(deadNode.id, mainMenu.id);
    });

    return hasReturnPath;
  }

  /**
   * 🛣️ Verificar se um nó pode alcançar outro nó
   */
  private canReachNode(fromNodeId: string, toNodeId: string): boolean {
    const visited = new Set<string>();
    const queue = [fromNodeId];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;

      if (currentNodeId === toNodeId) {
        return true;
      }

      if (visited.has(currentNodeId)) {
        continue;
      }

      visited.add(currentNodeId);

      const outgoingEdges = this.edges.filter(
        (e) => e.source === currentNodeId
      );
      outgoingEdges.forEach((edge) => {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
        }
      });
    }

    return false;
  }

  /**
   * 🚪 Validar caminhos de saída dos nós
   */
  private validateNodeExitPaths(): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Encontrar menu principal
    const mainMenu = this.nodes.find(
      (node) => node.data?.type === "mainMenu" || node.data?.isMainMenu
    );

    // Verificar cada nó que não é terminal
    this.nodes.forEach((node) => {
      if (
        node.data?.type !== "end" &&
        node.data?.type !== "transfer" &&
        node.data?.type !== "ticket"
      ) {
        const outgoingEdges = this.edges.filter((e) => e.source === node.id);

        // Se não tem saída e não é terminal
        if (outgoingEdges.length === 0) {
          // Verificar se é um nó que deveria retornar ao menu
          if (mainMenu && node.id !== mainMenu.id) {
            warnings.push({
              id: `should-return-to-menu-${node.id}`,
              type: "warning",
              nodeId: node.id,
              message: "Nó sem retorno ao menu",
              description: `O nó "${
                node.data?.label || node.data?.type
              }" não tem próximo passo nem conexão para retornar ao menu principal`,
              suggestion: `Conecte este nó ao menu principal ou adicione um nó de finalização`,
              category: "navigation",
            });
          }
        }

        // Verificar se nós de ação/resposta têm saída apropriada
        if (
          (node.data?.type === "message" ||
            node.data?.type === "action" ||
            node.data?.type === "webhook") &&
          outgoingEdges.length === 0
        ) {
          warnings.push({
            id: `action-no-continuation-${node.id}`,
            type: "warning",
            nodeId: node.id,
            message: "Ação sem continuação",
            description: `O nó "${
              node.data?.label || node.data?.type
            }" executa uma ação mas não tem próximo passo definido`,
            suggestion: mainMenu
              ? `Conecte ao menu principal ou adicione um nó de finalização`
              : `Adicione um próximo passo ou nó de finalização`,
            category: "flow",
          });
        }
      }
    });

    return warnings;
  }
}
