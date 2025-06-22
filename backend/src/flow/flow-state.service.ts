/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface FlowNode {
  id: string;
  type: string;
  data: {
    label?: string;
    message?: string;
    conditions?: Array<{
      id: string;
      field: string;
      operator: string;
      value: string;
      label: string;
      targetNodeId?: string;
    }>;
    delay?: number;
    [key: string]: any;
  };
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface ChatFlow {
  id: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  triggers: string[];
}

@Injectable()
export class FlowStateService {
  private readonly logger = new Logger(FlowStateService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 🚀 Iniciar um fluxo para um contato
   */
  async startFlow(
    companyId: string,
    whatsappSessionId: string,
    contactId: string,
    chatFlowId: string,
    triggerMessage?: string,
  ): Promise<{ success: boolean; nextNode?: FlowNode; response?: string }> {
    try {
      // Buscar o fluxo
      const chatFlow = await this.prisma.chatFlow.findFirst({
        where: { id: chatFlowId, companyId, isActive: true },
      });

      if (!chatFlow) {
        throw new Error(`Fluxo ${chatFlowId} não encontrado ou inativo`);
      }

      const flowData: ChatFlow = {
        id: chatFlow.id,
        nodes: JSON.parse(chatFlow.nodes),
        edges: JSON.parse(chatFlow.edges),
        triggers: JSON.parse(chatFlow.triggers),
      };

      // Encontrar nó de início
      const startNode = flowData.nodes.find((node) => node.type === 'start');
      if (!startNode) {
        throw new Error('Fluxo não possui nó de início');
      }

      // Finalizar estado anterior se existir
      await this.finishActiveFlow(companyId, whatsappSessionId, contactId);

      // Criar novo estado
      const flowState = await this.prisma.contactFlowState.create({
        data: {
          companyId,
          whatsappSessionId,
          contactId,
          chatFlowId,
          currentNodeId: startNode.id,
          isActive: true,
          variables: JSON.stringify({
            triggerMessage,
            startedAt: new Date().toISOString(),
          }),
          awaitingInput: false,
        },
      });

      // Registrar no histórico
      await this.logFlowHistory(
        flowState.id,
        startNode.id,
        startNode.type,
        'ENTERED',
        triggerMessage,
      );

      // Executar primeiro nó
      return await this.executeNode(flowState.id, startNode, flowData);
    } catch (error) {
      this.logger.error('Erro ao iniciar fluxo:', error);
      return { success: false };
    }
  }

  /**
   * 🎯 Processar entrada do usuário e avançar no fluxo
   */
  async processUserInput(
    companyId: string,
    whatsappSessionId: string,
    contactId: string,
    userMessage: string,
  ): Promise<{ success: boolean; nextNode?: FlowNode; response?: string }> {
    try {
      // Buscar estado ativo
      const flowState = await this.prisma.contactFlowState.findFirst({
        where: {
          companyId,
          whatsappSessionId,
          contactId,
          isActive: true,
        },
        include: {
          chatFlow: true,
        },
      });

      if (!flowState || !flowState.awaitingInput) {
        return { success: false };
      }

      const flowData: ChatFlow = {
        id: flowState.chatFlow.id,
        nodes: JSON.parse(flowState.chatFlow.nodes),
        edges: JSON.parse(flowState.chatFlow.edges),
        triggers: JSON.parse(flowState.chatFlow.triggers),
      };

      const currentNode = flowData.nodes.find(
        (node) => node.id === flowState.currentNodeId,
      );

      if (!currentNode) {
        throw new Error('Nó atual não encontrado');
      }

      // Atualizar variáveis
      const variables = JSON.parse(flowState.variables || '{}');
      variables.lastUserMessage = userMessage;
      variables.lastMessageAt = new Date().toISOString();

      // Registrar entrada do usuário
      await this.logFlowHistory(
        flowState.id,
        currentNode.id,
        currentNode.type,
        'USER_INPUT',
        userMessage,
      );

      // Processar baseado no tipo do nó
      if (currentNode.type === 'condition') {
        return await this.processCondition(
          flowState,
          currentNode,
          flowData,
          userMessage,
          variables,
        );
      }

      // Para outros tipos, avançar para próximo nó
      const nextNode = this.getNextNode(currentNode, flowData);
      if (nextNode) {
        await this.updateFlowState(flowState.id, nextNode.id, variables, false);
        return await this.executeNode(flowState.id, nextNode, flowData);
      }

      // Finalizar fluxo se não houver próximo nó
      await this.finishFlow(flowState.id);
      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao processar entrada do usuário:', error);
      return { success: false };
    }
  }

  /**
   * 🔀 Processar nó de condição
   */
  private async processCondition(
    flowState: any,
    conditionNode: FlowNode,
    flowData: ChatFlow,
    userMessage: string,
    variables: any,
  ): Promise<{ success: boolean; nextNode?: FlowNode; response?: string }> {
    const conditions = conditionNode.data.conditions || [];

    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, userMessage, variables);

      if (result) {
        // Condição atendida
        await this.logFlowHistory(
          flowState.id,
          conditionNode.id,
          'condition',
          'CONDITION_MET',
          userMessage,
          `Condição "${condition.label}" atendida`,
          condition.id,
        );

        // Encontrar nó de destino
        const targetNode = flowData.nodes.find(
          (node) => node.id === condition.targetNodeId,
        );

        if (targetNode) {
          await this.updateFlowState(
            flowState.id,
            targetNode.id,
            variables,
            false,
          );
          return await this.executeNode(flowState.id, targetNode, flowData);
        }
        break;
      }
    }

    // Nenhuma condição atendida - usar nó padrão ou finalizar
    const defaultEdge = flowData.edges.find(
      (edge) => edge.source === conditionNode.id && !edge.label,
    );

    if (defaultEdge) {
      const defaultNode = flowData.nodes.find(
        (node) => node.id === defaultEdge.target,
      );
      if (defaultNode) {
        await this.updateFlowState(
          flowState.id,
          defaultNode.id,
          variables,
          false,
        );
        return await this.executeNode(flowState.id, defaultNode, flowData);
      }
    }

    // Finalizar fluxo
    await this.finishFlow(flowState.id);
    return { success: true };
  }

  /**
   * ⚡ Executar um nó do fluxo
   */
  private async executeNode(
    flowStateId: string,
    node: FlowNode,
    flowData: ChatFlow,
  ): Promise<{ success: boolean; nextNode?: FlowNode; response?: string }> {
    try {
      await this.logFlowHistory(
        flowStateId,
        node.id,
        node.type,
        'EXECUTED',
        null,
        `Executando nó ${node.type}`,
      );

      switch (node.type) {
        case 'start':
          // Avançar automaticamente para próximo nó
          const nextAfterStart = this.getNextNode(node, flowData);
          if (nextAfterStart) {
            await this.updateFlowState(
              flowStateId,
              nextAfterStart.id,
              {},
              false,
            );
            return await this.executeNode(
              flowStateId,
              nextAfterStart,
              flowData,
            );
          }
          break;

        case 'message':
          // Enviar mensagem e aguardar entrada (se necessário)
          const message = node.data.message || node.data.label || 'Mensagem';
          const nextAfterMessage = this.getNextNode(node, flowData);

          if (nextAfterMessage) {
            if (nextAfterMessage.type === 'condition') {
              // Se próximo nó é condição, aguardar entrada
              await this.updateFlowState(
                flowStateId,
                nextAfterMessage.id,
                {},
                true,
              );
              return {
                success: true,
                nextNode: nextAfterMessage,
                response: message,
              };
            } else {
              // Continuar automaticamente
              await this.updateFlowState(
                flowStateId,
                nextAfterMessage.id,
                {},
                false,
              );
              return {
                success: true,
                nextNode: nextAfterMessage,
                response: message,
              };
            }
          } else {
            // Finalizar fluxo
            await this.finishFlow(flowStateId);
            return { success: true, response: message };
          }

        case 'condition':
          // Aguardar entrada do usuário
          await this.updateFlowState(flowStateId, node.id, {}, true);
          return {
            success: true,
            nextNode: node,
            response: node.data.message || 'Escolha uma opção:',
          };

        case 'delay':
          // Implementar delay se necessário
          const delayMs = (node.data.delay || 0) * 1000;
          if (delayMs > 0) {
            setTimeout(async () => {
              const nextAfterDelay = this.getNextNode(node, flowData);
              if (nextAfterDelay) {
                await this.updateFlowState(
                  flowStateId,
                  nextAfterDelay.id,
                  {},
                  false,
                );
                await this.executeNode(flowStateId, nextAfterDelay, flowData);
              }
            }, delayMs);
            return { success: true };
          }
          break;

        case 'transfer':
          // Transferir para atendente
          await this.finishFlow(flowStateId);
          return {
            success: true,
            response:
              node.data.transferMessage ||
              'Aguarde, vou transferir você para um atendente.',
          };

        case 'ticket':
          // Criar ticket
          await this.finishFlow(flowStateId);
          return {
            success: true,
            response:
              'Ticket criado com sucesso! Em breve entraremos em contato.',
          };

        case 'end':
          // Finalizar fluxo
          await this.finishFlow(flowStateId);
          return { success: true, response: 'Conversa finalizada.' };

        default:
          this.logger.warn(`Tipo de nó não implementado: ${node.type}`);
          const nextDefault = this.getNextNode(node, flowData);
          if (nextDefault) {
            await this.updateFlowState(flowStateId, nextDefault.id, {}, false);
            return await this.executeNode(flowStateId, nextDefault, flowData);
          }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Erro ao executar nó ${node.id}:`, error);
      return { success: false };
    }
  }
  /**
   * 🔍 Avaliar condição
   */
  private evaluateCondition(
    condition: any,
    userMessage: string,
    variables: any,
  ): boolean {
    const { field, operator, value } = condition;

    let fieldValue: string = '';

    // Buscar valor do campo nas variáveis ou mensagem
    switch (field) {
      case 'message':
      case 'user_message':
      case 'mensagem':
        fieldValue = userMessage.trim(); // Manter case original para números
        break;
      case 'user_name':
      case 'nome':
        fieldValue = variables.userName || '';
        break;
      case 'phone':
      case 'telefone':
        fieldValue = variables.phoneNumber || '';
        break;
      default:
        // Campo personalizado nas variáveis
        fieldValue = variables[field] || userMessage.trim();
    }

    // Para comparações numéricas, não converter para lowercase
    const isNumericComparison =
      ['greater', 'less', 'equals'].includes(operator) &&
      !isNaN(parseFloat(value));

    const conditionValue = isNumericComparison ? value : value.toLowerCase();
    const compareValue = isNumericComparison
      ? fieldValue
      : fieldValue.toLowerCase();

    switch (operator) {
      case 'equals':
      case 'igual':
        return compareValue === conditionValue;
      case 'contains':
      case 'contem':
        return compareValue.includes(conditionValue);
      case 'greater':
      case 'maior':
        return parseFloat(fieldValue) > parseFloat(conditionValue);
      case 'less':
      case 'menor':
        return parseFloat(fieldValue) < parseFloat(conditionValue);
      case 'exists':
      case 'existe':
        return fieldValue && fieldValue.trim() !== '';
      case 'regex':
        try {
          return new RegExp(conditionValue).test(fieldValue);
        } catch {
          return false;
        }
      default:
        this.logger.warn(`Operador não reconhecido: ${operator}`);
        return false;
    }
  }

  /**
   * ➡️ Obter próximo nó
   */
  private getNextNode(
    currentNode: FlowNode,
    flowData: ChatFlow,
  ): FlowNode | null {
    const edge = flowData.edges.find((e) => e.source === currentNode.id);
    if (edge) {
      return flowData.nodes.find((n) => n.id === edge.target) || null;
    }
    return null;
  }

  /**
   * 📝 Registrar histórico
   */
  private async logFlowHistory(
    contactFlowStateId: string,
    nodeId: string,
    nodeType: string,
    action: string,
    input?: string | null,
    output?: string | null,
    conditionResult?: string | null,
  ): Promise<void> {
    try {
      await this.prisma.contactFlowHistory.create({
        data: {
          contactFlowStateId,
          nodeId,
          nodeType,
          action,
          input,
          output,
          conditionResult,
          variables: null, // Pode ser implementado se necessário
          executionTime: null,
        },
      });
    } catch (error) {
      this.logger.error('Erro ao registrar histórico:', error);
    }
  }

  /**
   * 🔄 Atualizar estado do fluxo
   */
  private async updateFlowState(
    flowStateId: string,
    currentNodeId: string,
    variables: any,
    awaitingInput: boolean,
  ): Promise<void> {
    await this.prisma.contactFlowState.update({
      where: { id: flowStateId },
      data: {
        currentNodeId,
        variables: JSON.stringify(variables),
        awaitingInput,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 🏁 Finalizar fluxo ativo
   */
  private async finishActiveFlow(
    companyId: string,
    whatsappSessionId: string,
    contactId: string,
  ): Promise<void> {
    await this.prisma.contactFlowState.updateMany({
      where: {
        companyId,
        whatsappSessionId,
        contactId,
        isActive: true,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 🏁 Finalizar fluxo específico
   */
  private async finishFlow(flowStateId: string): Promise<void> {
    await this.prisma.contactFlowState.update({
      where: { id: flowStateId },
      data: {
        isActive: false,
        awaitingInput: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 🔍 Verificar se contato está em fluxo ativo
   */
  async getActiveFlowState(
    companyId: string,
    whatsappSessionId: string,
    contactId: string,
  ): Promise<any | null> {
    return await this.prisma.contactFlowState.findFirst({
      where: {
        companyId,
        whatsappSessionId,
        contactId,
        isActive: true,
      },
      include: {
        chatFlow: true,
      },
    });
  }

  /**
   * 🚀 Verificar se mensagem deve iniciar um fluxo
   */
  async shouldStartFlow(
    companyId: string,
    message: string,
  ): Promise<string | null> {
    const activeFlows = await this.prisma.chatFlow.findMany({
      where: { companyId, isActive: true },
    });

    for (const flow of activeFlows) {
      const triggers = JSON.parse(flow.triggers);
      const messageWords = message.toLowerCase().split(' ');

      for (const trigger of triggers) {
        if (messageWords.includes(trigger.toLowerCase())) {
          return flow.id;
        }
      }
    }

    return null;
  }
}
