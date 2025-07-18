import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { BusinessHoursService } from '../business-hours/business-hours.service';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../session/session.service';
import { WebhookService } from '../webhook/webhook.service';
import {
  ChatFlow,
  ContactFlowState,
  FlowCondition,
  FlowExecutionResult,
  FlowNode,
  FlowVariables,
} from './dto/flow-interfaces.dto';

@Injectable()
export class FlowStateService {
  private readonly logger = new Logger(FlowStateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessHoursService: BusinessHoursService,
    private readonly mediaService: MediaService,
    private readonly webhookService: WebhookService,
    @Inject(forwardRef(() => SessionService))
    private readonly sessionService: SessionService,
  ) {}
  /**
   * 🚀 Iniciar um fluxo para um contato
   */
  async startFlow(
    companyId: string,
    messagingSessionId: string,
    contactId: string,
    chatFlowId: string,
    triggerMessage?: string,
  ): Promise<FlowExecutionResult> {
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
      await this.finishActiveFlow(companyId, messagingSessionId, contactId);

      // Criar novo estado
      const flowState = await this.prisma.contactFlowState.create({
        data: {
          companyId,
          messagingSessionId,
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
      return await this.executeNode(
        flowState.id,
        startNode,
        flowData,
        companyId,
      );
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
    messagingSessionId: string,
    contactId: string,
    userMessage: string,
  ): Promise<FlowExecutionResult> {
    try {
      // Verificar comandos especiais primeiro
      const specialCommand = this.checkSpecialCommands(userMessage);
      if (specialCommand) {
        return await this.handleSpecialCommand(
          specialCommand,
          companyId,
          messagingSessionId,
          contactId,
        );
      }

      // Buscar estado ativo
      const flowState = await this.prisma.contactFlowState.findFirst({
        where: {
          companyId,
          messagingSessionId,
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
      } // Atualizar variáveis
      const variables: FlowVariables = JSON.parse(
        flowState.variables || '{}',
      ) as FlowVariables;
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

      if (currentNode.type === 'input') {
        return await this.processInputNode(
          flowState,
          currentNode,
          flowData,
          userMessage,
          variables,
        );
      }

      if (currentNode.type === 'menu' || currentNode.type === 'mainMenu') {
        return await this.processMenuInput(
          flowState,
          userMessage,
          currentNode,
          flowData,
          flowState.companyId,
        );
      }

      // Para outros tipos, avançar para próximo nó
      const nextNode = this.getNextNode(currentNode, flowData);
      if (nextNode) {
        await this.updateFlowState(flowState.id, nextNode.id, variables, false);
        return await this.executeNode(
          flowState.id,
          nextNode,
          flowData,
          flowState.companyId,
        );
      }

      // Se não houver próximo nó, recomeçar o fluxo ou mostrar menu principal
      return await this.restartFlowOrShowMenu(flowState, flowData);
    } catch (error) {
      this.logger.error('Erro ao processar entrada do usuário:', error);
      return { success: false };
    }
  } /**
   * 📝 Processar nó de input
   */
  private async processInputNode(
    flowState: ContactFlowState,
    inputNode: FlowNode,
    flowData: ChatFlow,
    userMessage: string,
    variables: FlowVariables,
  ): Promise<FlowExecutionResult> {
    const nodeData = inputNode.data;
    const variableName = nodeData.variableName as string;
    const validationType = nodeData.validation as string;
    const required = (nodeData.required as boolean) || false;
    const errorMessage =
      (nodeData.errorMessage as string) || 'Entrada inválida. Tente novamente.';

    // Validar entrada se for obrigatória
    if (required && (!userMessage || userMessage.trim() === '')) {
      return {
        success: true,
        response: 'Este campo é obrigatório. Por favor, digite uma resposta.',
      };
    }

    // Validar formato
    const validationResult = this.validateInput(userMessage, validationType);
    if (!validationResult.isValid) {
      return {
        success: true,
        response: validationResult.errorMessage || errorMessage,
      };
    }

    // Armazenar valor na variável
    if (variableName) {
      variables[variableName] = userMessage;
    }

    // Avançar para próximo nó
    const nextNode = this.getNextNode(inputNode, flowData);
    if (nextNode) {
      await this.updateFlowState(flowState.id, nextNode.id, variables, false);
      return await this.executeNode(
        flowState.id,
        nextNode,
        flowData,
        flowState.companyId,
      );
    }

    // Se não houver próximo nó, recomeçar o fluxo ou mostrar menu principal
    return await this.restartFlowOrShowMenu(flowState, flowData);
  }

  /**
   * ✅ Validar entrada do usuário
   */
  private validateInput(
    value: string,
    validationType: string,
  ): { isValid: boolean; errorMessage?: string } {
    if (!value || value.trim() === '') {
      return { isValid: true }; // Campos vazios são válidos se não forem obrigatórios
    }

    switch (validationType) {
      case 'text':
        return { isValid: true };

      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value)
          ? { isValid: true }
          : {
              isValid: false,
              errorMessage: 'Por favor, digite um e-mail válido.',
            };
      }

      case 'cpf': {
        const cpfValid = this.validateCPF(value);
        return cpfValid
          ? { isValid: true }
          : {
              isValid: false,
              errorMessage: 'Por favor, digite um CPF válido.',
            };
      }

      case 'phone': {
        const phoneRegex =
          /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/;
        return phoneRegex.test(value.replace(/\D/g, ''))
          ? { isValid: true }
          : {
              isValid: false,
              errorMessage: 'Por favor, digite um telefone válido.',
            };
      }

      case 'number': {
        const numberRegex = /^[0-9]+$/;
        return numberRegex.test(value)
          ? { isValid: true }
          : {
              isValid: false,
              errorMessage: 'Por favor, digite apenas números.',
            };
      }

      case 'cnpj': {
        const cnpjValid = this.validateCNPJ(value);
        return cnpjValid
          ? { isValid: true }
          : {
              isValid: false,
              errorMessage: 'Por favor, digite um CNPJ válido.',
            };
      }

      case 'cnh': {
        const cnhValid = this.validateCNH(value);
        return cnhValid
          ? { isValid: true }
          : {
              isValid: false,
              errorMessage: 'Por favor, digite uma CNH válida.',
            };
      }

      case 'plate': {
        const plateValid = this.validatePlate(value);
        return plateValid
          ? { isValid: true }
          : {
              isValid: false,
              errorMessage: 'Por favor, digite uma placa válida.',
            };
      }

      default:
        return { isValid: true };
    }
  }

  /**
   * 🆔 Validar CPF
   */
  private validateCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    // Calcula os dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i);
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cpf[9]) !== firstDigit) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i);
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(cpf[10]) === secondDigit;
  }

  /**
   * 🏢 Validar CNPJ
   */
  private validateCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/\D/g, '');

    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    // Calcula o primeiro dígito verificador
    let sum = 0;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * weights1[i];
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cnpj[12]) !== firstDigit) {
      return false;
    }

    // Calcula o segundo dígito verificador
    sum = 0;
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * weights2[i];
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(cnpj[13]) === secondDigit;
  }

  /**
   * 🚗 Validar CNH
   */
  private validateCNH(cnh: string): boolean {
    // Remove caracteres não numéricos
    cnh = cnh.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cnh.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cnh)) {
      return false;
    }

    // Algoritmo de validação da CNH
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cnh[i]) * (9 - i);
    }

    let remainder = sum % 11;
    const firstDigit = remainder >= 10 ? 0 : remainder;

    if (parseInt(cnh[9]) !== firstDigit) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cnh[i]) * (1 + (9 - i));
    }

    remainder = sum % 11;
    const secondDigit = remainder >= 10 ? 0 : remainder;

    return parseInt(cnh[10]) === secondDigit;
  }

  /**
   * 🚙 Validar Placa de Veículo
   */
  private validatePlate(plate: string): boolean {
    // Remove caracteres não alfanuméricos e converte para maiúscula
    plate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Verifica se tem 7 caracteres
    if (plate.length !== 7) {
      return false;
    }

    // Formato antigo: 3 letras + 4 números (ex: ABC1234)
    const oldFormat = /^[A-Z]{3}[0-9]{4}$/;

    // Formato Mercosul: 3 letras + 1 número + 1 letra + 2 números (ex: ABC1D23)
    const mercosulFormat = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;

    return oldFormat.test(plate) || mercosulFormat.test(plate);
  }

  /**
   * 🔀 Processar nó de condição
   */
  private async processCondition(
    flowState: ContactFlowState,
    conditionNode: FlowNode,
    flowData: ChatFlow,
    userMessage: string,
    variables: FlowVariables,
  ): Promise<FlowExecutionResult> {
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
          return await this.executeNode(
            flowState.id,
            targetNode,
            flowData,
            flowState.companyId,
          );
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
        return await this.executeNode(
          flowState.id,
          defaultNode,
          flowData,
          flowState.companyId,
        );
      }
    }

    // Se chegou aqui, não há próximo nó - recomeçar o fluxo ou mostrar menu principal
    return await this.restartFlowOrShowMenu(flowState, flowData);
  }
  /**
   * ⚡ Executar um nó do fluxo
   */
  private async executeNode(
    flowStateId: string,
    node: FlowNode,
    flowData: ChatFlow,
    companyId?: string,
  ): Promise<FlowExecutionResult> {
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
        case 'start': {
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
              companyId,
            );
          }
          break;
        }

        case 'message': {
          // Enviar mensagem e determinar se deve aguardar entrada
          const message = node.data.message || node.data.label || 'Mensagem';
          const nextAfterMessage = this.getNextNode(node, flowData);

          // Por padrão, nós de mensagem sempre aguardam resposta do usuário
          // exceto se explicitamente configurado para não aguardar
          const shouldAwaitInput = node.data.awaitInput !== false;

          if (nextAfterMessage && shouldAwaitInput) {
            // Aguardar entrada do usuário antes de continuar
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
          } else if (nextAfterMessage && !shouldAwaitInput) {
            // Continuar automaticamente (caso específico)
            await this.updateFlowState(
              flowStateId,
              nextAfterMessage.id,
              {},
              false,
            );
            // Executar próximo nó automaticamente
            const nextResult = await this.executeNode(
              flowStateId,
              nextAfterMessage,
              flowData,
              companyId,
            );
            return {
              success: true,
              response: message,
              nextNode: nextResult.nextNode,
              // Se o próximo nó também retornou uma resposta, concatenar
              ...(nextResult.response && {
                response: `${message}\n\n${nextResult.response}`,
              }),
            };
          } else {
            // Recomeçar fluxo - mensagem sem próximo nó
            return await this.restartFlowOrShowMenu(
              await this.prisma.contactFlowState.findUnique({
                where: { id: flowStateId },
                include: { chatFlow: true },
              }),
              flowData,
            );
          }
        }

        case 'image': {
          // Enviar imagem armazenada no sistema
          try {
            const nodeData = node.data as any;
            const mediaId = nodeData.mediaId || nodeData.imageId;
            if (!mediaId) {
              const errorMessage =
                'Erro: Nenhuma imagem configurada para este nó.';
              this.logger.warn(
                `Nó de imagem ${node.id} sem mediaId configurado`,
              );

              const nextAfterError = this.getNextNode(node, flowData);
              if (nextAfterError) {
                await this.updateFlowState(
                  flowStateId,
                  nextAfterError.id,
                  {},
                  true,
                );
                return {
                  success: true,
                  nextNode: nextAfterError,
                  response: errorMessage,
                };
              } else {
                await this.finishFlow(flowStateId);
                return { success: true, response: errorMessage };
              }
            }

            // Obter URL pública da imagem
            const imageUrl = await this.mediaService.getPublicUrl(
              String(mediaId),
              companyId || '',
            );

            if (!imageUrl) {
              const errorMessage = 'Erro: Imagem não encontrada.';
              this.logger.warn(
                `Imagem ${String(mediaId)} não encontrada para empresa ${companyId}`,
              );

              const nextAfterError = this.getNextNode(node, flowData);
              if (nextAfterError) {
                await this.updateFlowState(
                  flowStateId,
                  nextAfterError.id,
                  {},
                  true,
                );
                return {
                  success: true,
                  nextNode: nextAfterError,
                  response: errorMessage,
                };
              } else {
                await this.finishFlow(flowStateId);
                return { success: true, response: errorMessage };
              }
            }

            // Determinar se deve aguardar entrada do usuário
            const nextAfterImage = this.getNextNode(node, flowData);
            const shouldAwaitInput = nodeData.awaitInput !== false;
            const caption = String(nodeData.caption || nodeData.message || '');

            if (nextAfterImage && shouldAwaitInput) {
              // Aguardar entrada do usuário antes de continuar
              await this.updateFlowState(
                flowStateId,
                nextAfterImage.id,
                {},
                true,
              );
              return {
                success: true,
                nextNode: nextAfterImage,
                response: caption, // Texto que acompanha a imagem
                mediaUrl: imageUrl, // URL da imagem para envio
                mediaType: 'image',
              };
            } else if (nextAfterImage && !shouldAwaitInput) {
              // Continuar automaticamente para próximo nó
              await this.updateFlowState(
                flowStateId,
                nextAfterImage.id,
                {},
                false,
              );
              const nextResult = await this.executeNode(
                flowStateId,
                nextAfterImage,
                flowData,
                companyId,
              );
              return {
                success: true,
                response: caption,
                mediaUrl: imageUrl,
                mediaType: 'image',
                nextNode: nextResult.nextNode,
              };
            } else {
              // Finalizar fluxo
              await this.finishFlow(flowStateId);
              return {
                success: true,
                response: caption,
                mediaUrl: imageUrl,
                mediaType: 'image',
              };
            }
          } catch (error) {
            this.logger.error(
              `Erro ao processar nó de imagem ${node.id}:`,
              error,
            );
            const errorMessage = 'Erro interno ao carregar imagem.';

            const nextAfterError = this.getNextNode(node, flowData);
            if (nextAfterError) {
              await this.updateFlowState(
                flowStateId,
                nextAfterError.id,
                {},
                true,
              );
              return {
                success: true,
                nextNode: nextAfterError,
                response: errorMessage,
              };
            } else {
              await this.finishFlow(flowStateId);
              return { success: true, response: errorMessage };
            }
          }
        }

        case 'file': {
          // Enviar arquivo/documento armazenado no sistema
          try {
            const nodeData = node.data as any;
            const mediaId = nodeData.mediaId || nodeData.fileId;
            if (!mediaId) {
              const errorMessage =
                'Erro: Nenhum arquivo configurado para este nó.';
              this.logger.warn(
                `Nó de arquivo ${node.id} sem mediaId configurado`,
              );

              const nextAfterError = this.getNextNode(node, flowData);
              if (nextAfterError) {
                await this.updateFlowState(
                  flowStateId,
                  nextAfterError.id,
                  {},
                  true,
                );
                return {
                  success: true,
                  nextNode: nextAfterError,
                  response: errorMessage,
                };
              } else {
                await this.finishFlow(flowStateId);
                return { success: true, response: errorMessage };
              }
            }

            // Obter URL pública do arquivo
            const fileUrl = await this.mediaService.getPublicUrl(
              String(mediaId),
              companyId || '',
            );

            if (!fileUrl) {
              const errorMessage = 'Erro: Arquivo não encontrado.';
              this.logger.warn(
                `Arquivo ${String(mediaId)} não encontrado para empresa ${companyId}`,
              );

              const nextAfterError = this.getNextNode(node, flowData);
              if (nextAfterError) {
                await this.updateFlowState(
                  flowStateId,
                  nextAfterError.id,
                  {},
                  true,
                );
                return {
                  success: true,
                  nextNode: nextAfterError,
                  response: errorMessage,
                };
              } else {
                await this.finishFlow(flowStateId);
                return { success: true, response: errorMessage };
              }
            }

            // Determinar se deve aguardar entrada do usuário
            const nextAfterFile = this.getNextNode(node, flowData);
            const shouldAwaitInput = nodeData.awaitInput !== false;
            const caption = String(
              nodeData.caption ||
                nodeData.message ||
                nodeData.description ||
                '',
            );

            if (nextAfterFile && shouldAwaitInput) {
              // Aguardar entrada do usuário antes de continuar
              await this.updateFlowState(
                flowStateId,
                nextAfterFile.id,
                {},
                true,
              );
              return {
                success: true,
                nextNode: nextAfterFile,
                response: caption, // Texto que acompanha o arquivo
                mediaUrl: fileUrl, // URL do arquivo para envio
                mediaType: 'document',
              };
            } else if (nextAfterFile && !shouldAwaitInput) {
              // Continuar automaticamente para próximo nó
              await this.updateFlowState(
                flowStateId,
                nextAfterFile.id,
                {},
                false,
              );
              const nextResult = await this.executeNode(
                flowStateId,
                nextAfterFile,
                flowData,
                companyId,
              );
              return {
                success: true,
                response: caption,
                mediaUrl: fileUrl,
                mediaType: 'document',
                nextNode: nextResult.nextNode,
              };
            } else {
              // Finalizar fluxo
              await this.finishFlow(flowStateId);
              return {
                success: true,
                response: caption,
                mediaUrl: fileUrl,
                mediaType: 'document',
              };
            }
          } catch (error) {
            this.logger.error(
              `Erro ao processar nó de arquivo ${node.id}:`,
              error,
            );
            const errorMessage = 'Erro interno ao carregar arquivo.';

            const nextAfterError = this.getNextNode(node, flowData);
            if (nextAfterError) {
              await this.updateFlowState(
                flowStateId,
                nextAfterError.id,
                {},
                true,
              );
              return {
                success: true,
                nextNode: nextAfterError,
                response: errorMessage,
              };
            } else {
              await this.finishFlow(flowStateId);
              return { success: true, response: errorMessage };
            }
          }
        }

        case 'condition': {
          // Aguardar entrada do usuário
          await this.updateFlowState(flowStateId, node.id, {}, true);
          return {
            success: true,
            nextNode: node,
            response: node.data.message || 'Escolha uma opção:',
          };
        }
        case 'delay': {
          // Implementar delay se necessário
          const delayMs = (node.data.delay || 0) * 1000;
          if (delayMs > 0) {
            setTimeout(() => {
              void (async () => {
                const nextAfterDelay = this.getNextNode(node, flowData);
                if (nextAfterDelay) {
                  await this.updateFlowState(
                    flowStateId,
                    nextAfterDelay.id,
                    {},
                    false,
                  );
                  await this.executeNode(
                    flowStateId,
                    nextAfterDelay,
                    flowData,
                    companyId,
                  );
                }
              })();
            }, delayMs);
            return { success: true };
          }
          break;
        }

        case 'transfer': {
          // 🕐 Verificar se está dentro do horário de funcionamento
          // Usar a mesma lógica que o ConversationService para consistência
          if (companyId) {
            try {
              const isBusinessOpen =
                await this.businessHoursService.isBusinessOpen(
                  companyId,
                  new Date(),
                );

              if (!isBusinessOpen) {
                // Fora do horário - usar lógica consistente com ConversationService
                const outOfHoursResponse =
                  await this.buildOutOfHoursMessage(companyId);

                // 🔄 RECOMEÇAR o nó atual - permite que o usuário tente outras opções
                // Mantém o estado no nó atual e aguarda nova entrada do usuário
                await this.updateFlowState(flowStateId, node.id, {}, true);
                return {
                  success: true,
                  nextNode: node, // Volta para o próprio nó transfer
                  response: outOfHoursResponse,
                };
              }
            } catch (error) {
              this.logger.error(
                'Erro ao verificar horário de funcionamento no nó transfer:',
                error,
              );
              // Em caso de erro, continuar com transferência normal
            }
          }

          // Dentro do horário ou erro na verificação - transferir normalmente

          // 🎫 IMPORTANTE: Atualizar status do ticket para IN_PROGRESS antes de finalizar o fluxo
          try {
            // Buscar informações do fluxo para encontrar o ticket
            const flowState = await this.prisma.contactFlowState.findUnique({
              where: { id: flowStateId },
            });

            if (flowState) {
              // Buscar ticket ativo para este contato
              const activeTicket = await this.prisma.ticket.findFirst({
                where: {
                  companyId: flowState.companyId,
                  contactId: flowState.contactId,
                  messagingSessionId: flowState.messagingSessionId,
                  status: {
                    in: ['OPEN', 'WAITING_CUSTOMER'],
                  },
                },
              });

              if (activeTicket) {
                // Atualizar status para IN_PROGRESS (transferido para humano)
                await this.prisma.ticket.update({
                  where: { id: activeTicket.id },
                  data: {
                    status: 'IN_PROGRESS',
                    updatedAt: new Date(),
                  },
                });

                // Registrar no histórico
                try {
                  await this.prisma.ticketHistory.create({
                    data: {
                      ticketId: activeTicket.id,
                      action: 'TRANSFERRED',
                      toValue: 'IN_PROGRESS',
                      comment:
                        'Ticket transferido para atendimento humano via fluxo',
                    },
                  });
                } catch (historyError) {
                  this.logger.warn(
                    `Não foi possível criar histórico para ticket ${activeTicket.id}:`,
                    historyError.message,
                  );
                }

                this.logger.log(
                  `🎯 Ticket ${activeTicket.id} transferido para atendimento humano (IN_PROGRESS)`,
                );
              }
            }
          } catch (error) {
            this.logger.error(
              'Erro ao atualizar status do ticket durante transferência:',
              error,
            );
            // Não interromper o fluxo por erro na atualização do ticket
          }

          // Finalizar o fluxo (mas não fechar o ticket, apenas o fluxo)
          await this.finishFlow(flowStateId, undefined, false);
          return {
            success: true,
            response:
              node.data.transferMessage ||
              '👨‍💼 Transferindo você para um de nossos atendentes...\n\nAguarde um momento que alguém da nossa equipe entrará em contato.',
          };
        }

        case 'webhook': {
          // Executar webhook HTTP
          const nodeData = node.data;
          const webhookUrl = nodeData.webhookUrl as string;
          const webhookMethod = (nodeData.webhookMethod as string) || 'POST';

          if (!webhookUrl) {
            this.logger.warn(`Nó webhook ${node.id} sem URL configurada`);
            const nextAfterError = this.getNextNode(node, flowData);
            if (nextAfterError) {
              await this.updateFlowState(
                flowStateId,
                nextAfterError.id,
                {},
                false,
              );
              return await this.executeNode(
                flowStateId,
                nextAfterError,
                flowData,
                companyId,
              );
            } else {
              await this.finishFlow(flowStateId);
              return { success: true };
            }
          }

          // Buscar estado atual para obter variáveis
          const currentState = await this.prisma.contactFlowState.findUnique({
            where: { id: flowStateId },
          });

          const variables = currentState
            ? (JSON.parse(currentState.variables || '{}') as FlowVariables)
            : {};

          // Executar webhook
          const webhookResult = await this.webhookService.executeWebhook(
            webhookUrl,
            webhookMethod,
            {
              useAuthentication: nodeData.useAuthentication as boolean,
              authType: nodeData.authType as string,
              authToken: nodeData.authToken as string,
              apiKeyHeader: nodeData.apiKeyHeader as string,
              apiKeyValue: nodeData.apiKeyValue as string,
              basicUsername: nodeData.basicUsername as string,
              basicPassword: nodeData.basicPassword as string,
              includeFlowVariables: nodeData.includeFlowVariables as boolean,
              includeMetadata: nodeData.includeMetadata as boolean,
              customPayload: nodeData.customPayload as string,
              flowVariables: variables,
              metadata: {
                companyId: companyId || '',
                contactId: currentState?.contactId || '',
                messagingSessionId: currentState?.messagingSessionId || '',
              },
            },
          );

          // Salvar resposta em variável se configurado
          if (
            nodeData.waitForResponse &&
            nodeData.responseVariable &&
            webhookResult.success
          ) {
            variables[nodeData.responseVariable] = webhookResult.data;
          }

          // Avançar para próximo nó
          const nextAfterWebhook = this.getNextNode(node, flowData);
          if (nextAfterWebhook) {
            await this.updateFlowState(
              flowStateId,
              nextAfterWebhook.id,
              variables,
              false,
            );
            return await this.executeNode(
              flowStateId,
              nextAfterWebhook,
              flowData,
              companyId,
            );
          } else {
            await this.finishFlow(flowStateId);
            return { success: true };
          }
        }

        case 'input': {
          // Nó de entrada - sempre aguarda entrada do usuário
          const message =
            (node.data.message as string) || 'Por favor, digite sua resposta:';
          const nextAfterInput = this.getNextNode(node, flowData);

          if (nextAfterInput) {
            await this.updateFlowState(
              flowStateId,
              nextAfterInput.id,
              {},
              true,
            );
            return {
              success: true,
              nextNode: nextAfterInput,
              response: message,
            };
          } else {
            await this.finishFlow(flowStateId);
            return { success: true, response: message };
          }
        }

        case 'menu':
        case 'mainMenu': {
          return await this.executeMenuNode(flowStateId, node);
        }

        case 'ticket': {
          // Criar ticket
          await this.finishFlow(flowStateId);
          return {
            success: true,
            response:
              'Ticket criado com sucesso! Em breve entraremos em contato.',
          };
        }

        case 'end': {
          // Finalizar fluxo com mensagem personalizada
          const endMessage =
            (node.data?.message as string) ||
            'Conversa finalizada. Obrigado pelo contato!';
          await this.finishFlow(flowStateId, endMessage);
          return { success: true, response: endMessage };
        }

        default: {
          this.logger.warn(`Tipo de nó não implementado: ${node.type}`);
          const nextDefault = this.getNextNode(node, flowData);
          if (nextDefault) {
            await this.updateFlowState(flowStateId, nextDefault.id, {}, false);
            return await this.executeNode(
              flowStateId,
              nextDefault,
              flowData,
              companyId,
            );
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Erro ao executar nó ${node.id}:`, error);
      return { success: false };
    }
  } /**
   * 🤔 Verificar se deve iniciar um fluxo baseado na mensagem
   */
  async shouldStartFlow(
    companyId: string,
    message: string,
  ): Promise<string | false> {
    try {
      // Buscar fluxos ativos da empresa que têm triggers
      const activeFlows = await this.prisma.chatFlow.findMany({
        where: {
          companyId,
          isActive: true,
        },
      });

      if (!activeFlows.length) {
        return false;
      }

      // Verificar cada fluxo para ver se algum trigger corresponde à mensagem
      for (const flow of activeFlows) {
        // Buscar triggers no campo específico do fluxo
        let flowTriggers: string[] = [];
        try {
          if (flow.triggers) {
            flowTriggers = JSON.parse(flow.triggers);
          }
        } catch {
          this.logger.warn(`Erro ao parsear triggers do fluxo ${flow.id}`);
          continue;
        }

        // Verificar se a mensagem corresponde a algum trigger simples
        if (flowTriggers && Array.isArray(flowTriggers)) {
          for (const trigger of flowTriggers) {
            if (this.matchesSimpleTrigger(message, trigger)) {
              this.logger.log(
                `Fluxo ${flow.id} deve ser iniciado - trigger: "${trigger}"`,
              );
              return flow.id;
            }
          }
        }

        // Verificar triggers nos nós do fluxo
        try {
          const flowData: ChatFlow = {
            id: flow.id,
            nodes: JSON.parse(flow.nodes),
            edges: flow.edges ? JSON.parse(flow.edges) : [],
            triggers: flowTriggers,
          };

          // Procurar nó de início (trigger)
          const startNode = flowData.nodes.find(
            (node) => node.type === 'trigger' || node.type === 'start',
          );

          if (startNode && startNode.data?.triggers) {
            const nodeTriggers = startNode.data.triggers;

            if (Array.isArray(nodeTriggers)) {
              for (const trigger of nodeTriggers) {
                if (this.matchesTrigger(message, trigger)) {
                  this.logger.log(
                    `Fluxo ${flow.id} deve ser iniciado - trigger do nó: "${trigger.value}"`,
                  );
                  return flow.id;
                }
              }
            }
          }
        } catch {
          this.logger.warn(`Erro ao parsear dados do fluxo ${flow.id}`);
          continue;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Erro ao verificar se deve iniciar fluxo: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * 🎯 Verificar se uma mensagem corresponde a um trigger
   */
  private matchesTrigger(message: string, trigger: any): boolean {
    if (!trigger || typeof trigger !== 'object' || !trigger.value) {
      return false;
    }

    const normalizedMessage = message.toLowerCase().trim();
    const normalizedTrigger = String(trigger.value).toLowerCase().trim();
    const triggerType = trigger.type || 'exact';

    switch (triggerType) {
      case 'exact':
        return normalizedMessage === normalizedTrigger;

      case 'contains':
        return normalizedMessage.includes(normalizedTrigger);

      case 'starts_with':
        return normalizedMessage.startsWith(normalizedTrigger);

      case 'ends_with':
        return normalizedMessage.endsWith(normalizedTrigger);

      case 'regex':
        try {
          const regex = new RegExp(normalizedTrigger, 'i');
          return regex.test(normalizedMessage);
        } catch {
          this.logger.warn(`Regex inválido: ${normalizedTrigger}`);
          return false;
        }

      default:
        // Por padrão, usar correspondência exata
        return normalizedMessage === normalizedTrigger;
    }
  }

  /**
   * 🎯 Verificar se uma mensagem corresponde a um trigger simples (string)
   */
  private matchesSimpleTrigger(message: string, trigger: string): boolean {
    const normalizedMessage = message.toLowerCase().trim();
    const normalizedTrigger = String(trigger).toLowerCase().trim();

    // Por padrão, usar correspondência por "contém"
    return normalizedMessage.includes(normalizedTrigger);
  }

  /**
   * 🔍 Avaliar condição com acesso inteligente às variáveis
   */
  private evaluateCondition(
    condition: FlowCondition,
    userMessage: string,
    variables: FlowVariables,
  ): boolean {
    const { field, operator, value } = condition;

    let fieldValue: string = '';

    // Buscar valor do campo nas variáveis ou mensagem com lógica aprimorada
    switch (field) {
      case 'message':
      case 'user_message':
      case 'mensagem':
        fieldValue = userMessage.trim();
        break;
      case 'lastUserMessage':
        fieldValue = String(variables.lastUserMessage || userMessage.trim());
        break;
      case 'user_name':
      case 'nome': {
        const nameValue = variables.userName || variables.nome || '';
        fieldValue =
          typeof nameValue === 'string'
            ? nameValue
            : typeof nameValue === 'object' && nameValue !== null
              ? JSON.stringify(nameValue)
              : String(nameValue);
        break;
      }
      case 'phone':
      case 'telefone': {
        const phoneValue = variables.phoneNumber || variables.telefone || '';
        fieldValue =
          typeof phoneValue === 'string'
            ? phoneValue
            : typeof phoneValue === 'object' && phoneValue !== null
              ? JSON.stringify(phoneValue)
              : String(phoneValue);
        break;
      }
      case 'email': {
        const emailValue = variables.email || '';
        fieldValue =
          typeof emailValue === 'string'
            ? emailValue
            : typeof emailValue === 'object' && emailValue !== null
              ? JSON.stringify(emailValue)
              : String(emailValue);
        break;
      }
      case 'cpf': {
        const cpfValue = variables.cpf || '';
        fieldValue =
          typeof cpfValue === 'string'
            ? cpfValue
            : typeof cpfValue === 'object' && cpfValue !== null
              ? JSON.stringify(cpfValue)
              : String(cpfValue);
        break;
      }
      case 'cnpj': {
        const cnpjValue = variables.cnpj || '';
        fieldValue =
          typeof cnpjValue === 'string'
            ? cnpjValue
            : typeof cnpjValue === 'object' && cnpjValue !== null
              ? JSON.stringify(cnpjValue)
              : String(cnpjValue);
        break;
      }
      default: {
        // Primeiro, tentar buscar diretamente pelo nome da variável
        let varValue = variables[field];

        // Se não encontrou, tentar sem o $ caso o campo comece com $
        if (varValue === undefined && field.startsWith('$')) {
          varValue = variables[field.substring(1)];
        }

        // Se ainda não encontrou, tentar buscar em variáveis comuns
        if (varValue === undefined) {
          // Buscar em variáveis de input comuns
          const commonVariables = [
            'nome',
            'email',
            'telefone',
            'cpf',
            'cnpj',
            'endereco',
            'idade',
            'profissao',
            'empresa',
            'observacoes',
          ];

          for (const commonVar of commonVariables) {
            if (
              field.toLowerCase().includes(commonVar) ||
              commonVar.includes(field.toLowerCase())
            ) {
              varValue = variables[commonVar];
              break;
            }
          }
        }

        fieldValue =
          typeof varValue === 'string'
            ? varValue
            : typeof varValue === 'number'
              ? varValue.toString()
              : typeof varValue === 'boolean'
                ? varValue.toString()
                : varValue !== undefined && varValue !== null
                  ? JSON.stringify(varValue)
                  : userMessage.trim(); // Fallback para mensagem atual

        // Log para debug quando não encontrar a variável
        if (
          varValue === undefined &&
          field !== 'message' &&
          field !== 'user_message'
        ) {
          this.logger.debug(
            `Variável '${field}' não encontrada. Variáveis disponíveis: ${Object.keys(variables).join(', ')}`,
          );
        }
      }
    }

    // Para comparações numéricas, não converter para lowercase
    const isNumericComparison =
      ['greater', 'less', 'equals', 'maior', 'menor', 'igual'].includes(
        operator,
      ) &&
      !isNaN(parseFloat(value)) &&
      !isNaN(parseFloat(fieldValue));

    const conditionValue = isNumericComparison ? value : value.toLowerCase();
    const compareValue = isNumericComparison
      ? fieldValue
      : fieldValue.toLowerCase();

    // Log para debug
    this.logger.debug(
      `Avaliando condição: ${field} (${fieldValue}) ${operator} ${value}`,
    );

    switch (operator) {
      case 'equals':
      case 'igual':
        return isNumericComparison
          ? parseFloat(fieldValue) === parseFloat(conditionValue)
          : compareValue === conditionValue;
      case 'contains':
      case 'contem':
        return compareValue.includes(conditionValue);
      case 'starts_with':
      case 'comeca_com':
        return compareValue.startsWith(conditionValue);
      case 'ends_with':
      case 'termina_com':
        return compareValue.endsWith(conditionValue);
      case 'greater':
      case 'maior':
        return parseFloat(fieldValue) > parseFloat(conditionValue);
      case 'greater_equal':
      case 'maior_igual':
        return parseFloat(fieldValue) >= parseFloat(conditionValue);
      case 'less':
      case 'menor':
        return parseFloat(fieldValue) < parseFloat(conditionValue);
      case 'less_equal':
      case 'menor_igual':
        return parseFloat(fieldValue) <= parseFloat(conditionValue);
      case 'exists':
      case 'existe':
        return Boolean(fieldValue && fieldValue.trim() !== '');
      case 'not_exists':
      case 'nao_existe':
        return !(fieldValue && fieldValue.trim() !== '');
      case 'regex':
        try {
          return new RegExp(conditionValue, 'i').test(fieldValue);
        } catch {
          this.logger.warn(`Regex inválida: ${conditionValue}`);
          return false;
        }
      case 'in_list':
      case 'na_lista': {
        // Valor deve ser uma lista separada por vírgulas
        const listValues = conditionValue
          .split(',')
          .map((v) => v.trim().toLowerCase());
        return listValues.includes(compareValue);
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
    variables: FlowVariables,
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
    messagingSessionId: string,
    contactId: string,
  ): Promise<void> {
    await this.prisma.contactFlowState.updateMany({
      where: {
        companyId,
        messagingSessionId,
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
   * 🏁 Finalizar fluxo específico com mensagem de fechamento
   * NOVO: Agora também fecha o ticket automaticamente quando o fluxo termina
   * @param flowStateId ID do estado do fluxo
   * @param closingMessage Mensagem de fechamento opcional
   * @param shouldCloseTicket Se deve fechar o ticket automaticamente (padrão: true)
   */
  private async finishFlow(
    flowStateId: string,
    closingMessage?: string,
    shouldCloseTicket = true,
  ): Promise<void> {
    // Buscar informações do fluxo para enviar mensagem e fechar ticket
    const flowState = await this.prisma.contactFlowState.findUnique({
      where: { id: flowStateId },
      include: {
        contact: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!flowState) {
      this.logger.error(
        `FlowState ${flowStateId} não encontrado para finalização`,
      );
      return;
    }

    // 1. Finalizar o estado do fluxo
    await this.prisma.contactFlowState.update({
      where: { id: flowStateId },
      data: {
        isActive: false,
        awaitingInput: false,
        updatedAt: new Date(),
      },
    });

    // 2. 🎫 Fechar ticket ativo relacionado a este contato (apenas se shouldCloseTicket=true)
    if (shouldCloseTicket) {
      try {
        const activeTicket = await this.prisma.ticket.findFirst({
          where: {
            companyId: flowState.companyId,
            contactId: flowState.contactId,
            messagingSessionId: flowState.messagingSessionId,
            status: {
              in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
            },
          },
        });

        if (activeTicket) {
          const now = new Date();

          // Fechar o ticket
          await this.prisma.ticket.update({
            where: { id: activeTicket.id },
            data: {
              status: 'CLOSED',
              closedAt: now,
              updatedAt: now,
            },
          });

          // Registrar no histórico (se a tabela existir)
          try {
            await this.prisma.ticketHistory.create({
              data: {
                ticketId: activeTicket.id,
                action: 'FLOW_COMPLETED',
                toValue: 'CLOSED',
                comment: 'Ticket fechado automaticamente - fluxo finalizado',
              },
            });
          } catch (historyError) {
            this.logger.warn(
              `Não foi possível criar histórico para ticket ${activeTicket.id}:`,
              historyError.message,
            );
          }

          this.logger.log(
            `🎫 Ticket ${activeTicket.id} fechado automaticamente - fluxo finalizado`,
          );
        }
      } catch (error) {
        this.logger.error(
          'Erro ao fechar ticket durante finalização do fluxo:',
          error,
        );
        // Não interromper o fluxo por erro no fechamento do ticket
      }
    } else {
      this.logger.log(
        `🎯 Fluxo finalizado sem fechar ticket (transferido para humano)`,
      );
    }

    // 3. Enviar mensagem de fechamento se fornecida
    if (closingMessage) {
      try {
        await this.sendClosingMessage(
          flowState.contact.messagingSessionId,
          flowState.companyId,
          closingMessage,
        );
      } catch (error) {
        this.logger.error('Erro ao enviar mensagem de fechamento:', error);
      }
    }
  }

  /**
   * 📤 Enviar mensagem de fechamento
   */
  private async sendClosingMessage(
    messagingSessionId: string,
    companyId: string,
    message: string,
  ): Promise<void> {
    try {
      // Buscar dados do contato
      const contact = await this.prisma.contact.findFirst({
        where: {
          messagingSessionId,
          companyId,
        },
      });

      if (!contact || !contact.phoneNumber) {
        this.logger.warn(
          `Contato não encontrado ou sem número para ${messagingSessionId}`,
        );
        return;
      }

      // Buscar sessão de mensageria ativa da empresa (WhatsApp)
      const messagingSession = await this.prisma.messagingSession.findFirst({
        where: {
          companyId,
          status: 'CONNECTED',
          platform: 'WHATSAPP',
        },
      });

      if (!messagingSession) {
        this.logger.warn(
          `Nenhuma sessão WhatsApp conectada encontrada para empresa ${companyId}`,
        );
        return;
      }

      // 🔥 NOVO: Usar sendMessageOnly para evitar duplicação
      // A mensagem será salva automaticamente pelo handleOutgoingMessage
      await this.sessionService.sendMessageOnly(
        messagingSession.id,
        contact.phoneNumber,
        message,
      );

      this.logger.log(
        `✅ Mensagem de fechamento enviada para ${contact.phoneNumber} via sessão ${messagingSession.id}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar mensagem de fechamento para ${messagingSessionId}:`,
        error,
      );
    }
  }

  /**
   * 🔄 Recomeçar fluxo ou mostrar menu principal quando não há próximo nó
   * 🚀 MELHORADO: Prioriza retorno ao menu principal para melhor UX
   */
  private async restartFlowOrShowMenu(
    flowState: ContactFlowState | null,
    flowData: ChatFlow,
  ): Promise<FlowExecutionResult> {
    if (!flowState) {
      return { success: false };
    }

    // Preservar variáveis existentes
    const variables: FlowVariables = JSON.parse(
      flowState.variables || '{}',
    ) as FlowVariables;

    // 1. 🔥 PRIORIDADE: Procurar por menu principal (mainMenu ou menu marcado como principal)
    const mainMenuNode = flowData.nodes.find(
      (node) =>
        node.type === 'mainMenu' ||
        (node.type === 'menu' && node.data?.isMainMenu === true) ||
        (node.type === 'menu' &&
          (node.data?.label?.toLowerCase().includes('principal') ||
            node.data?.label?.toLowerCase().includes('main'))),
    );

    // 2. Se não encontrou menu principal, procurar qualquer menu
    const anyMenuNode = !mainMenuNode
      ? flowData.nodes.find(
          (node) =>
            node.type === 'menu' ||
            node.data?.label?.toLowerCase().includes('menu') ||
            node.data?.label?.toLowerCase().includes('opções'),
        )
      : null;

    // 3. Se não encontrou nenhum menu, procurar nó de início
    const startNode =
      !mainMenuNode && !anyMenuNode
        ? flowData.nodes.find((node) => node.type === 'start')
        : null;

    const targetNode = mainMenuNode || anyMenuNode || startNode;

    if (targetNode) {
      // Encontrou nó adequado - navegar para ele
      await this.updateFlowState(flowState.id, targetNode.id, variables, false);

      this.logger.debug(
        `🔄 Redirecionando para ${targetNode.type} (${targetNode.id}): ${targetNode.data?.label}`,
      );

      // Executar o nó
      return await this.executeNode(
        flowState.id,
        targetNode,
        flowData,
        flowState.companyId,
      );
    } else {
      // 4. 🚨 FALLBACK: Não encontrou menu específico - buscar menu global da empresa
      const globalMenuResult = await this.findAndExecuteGlobalMenu(
        flowState.companyId,
        flowState.messagingSessionId,
        flowState.contactId,
      );

      if (globalMenuResult.success) {
        return globalMenuResult;
      }

      // 5. 🆘 ÚLTIMO RECURSO: Mostrar opções padrão e manter fluxo ativo
      await this.updateFlowState(
        flowState.id,
        flowState.currentNodeId,
        variables,
        true,
      );

      return {
        success: true,
        response: `🤖 **Conversa finalizada!**

*O que você gostaria de fazer agora?*

📋 Digite *menu* - Ver opções disponíveis
👥 Digite *atendimento* - Falar com nossa equipe  
🔄 Digite *inicio* - Recomeçar conversa
ℹ️ Digite *ajuda* - Ver comandos disponíveis

Ou envie qualquer mensagem para continuar! 😊`,
        awaitingInput: true,
      };
    }
  }

  /**
   * 🌐 Buscar e executar menu global da empresa
   * Procura por fluxos ativos que sejam menus principais
   */
  private async findAndExecuteGlobalMenu(
    companyId: string,
    messagingSessionId: string,
    contactId: string,
  ): Promise<FlowExecutionResult> {
    try {
      // Buscar fluxos ativos da empresa que contenham menus
      const flowsWithMenus = await this.prisma.chatFlow.findMany({
        where: {
          companyId,
          isActive: true,
        },
      });

      for (const flow of flowsWithMenus) {
        try {
          const flowData: ChatFlow = {
            id: flow.id,
            nodes: JSON.parse(flow.nodes),
            edges: JSON.parse(flow.edges),
            triggers: JSON.parse(flow.triggers || '[]'),
          };

          // Verificar se este fluxo tem um menu principal
          const mainMenu = flowData.nodes.find(
            (node) =>
              node.type === 'mainMenu' ||
              (node.type === 'menu' && node.data?.isMainMenu === true) ||
              (node.type === 'start' &&
                flowData.nodes.some((n) => n.type === 'menu')),
          );

          if (mainMenu) {
            // Encontrou um menu - iniciar este fluxo
            this.logger.log(
              `🌐 Redirecionando para menu global do fluxo ${flow.id}: ${flow.name}`,
            );

            return await this.startFlow(
              companyId,
              messagingSessionId,
              contactId,
              flow.id,
              'menu_redirect',
            );
          }
        } catch (parseError) {
          this.logger.warn(`Erro ao parsear fluxo ${flow.id}:`, parseError);
          continue;
        }
      }

      return { success: false };
    } catch (error) {
      this.logger.error('Erro ao buscar menu global:', error);
      return { success: false };
    }
  }

  /**
   * 🏁 Finalizar fluxo por inatividade (chamado pelo scheduler)
   * NOVO: Agora também fecha tickets por inatividade
   */
  async finishFlowByInactivity(
    companyId: string,
    contactId?: string,
    messagingSessionId?: string,
  ): Promise<void> {
    const whereClause: any = {
      companyId,
      isActive: true,
    };

    if (contactId) {
      whereClause.contactId = contactId;
    }

    if (messagingSessionId) {
      whereClause.contact = {
        messagingSessionId,
      };
    }

    const activeFlows = await this.prisma.contactFlowState.findMany({
      where: whereClause,
      include: {
        contact: true,
      },
    });

    const inactivityMessage = `⏰ **Conversa finalizada por inatividade**

Obrigado pelo contato! Nossa conversa foi encerrada automaticamente devido à inatividade.

🚀 **Para iniciar uma nova conversa**, basta enviar qualquer mensagem!

📞 **Precisa de ajuda urgente?** Digite *atendimento* para falar com nossa equipe.`;

    // 🎫 NOVO: Coletar tickets que serão fechados
    const ticketsToClose: string[] = [];

    for (const flowState of activeFlows) {
      // Finalizar fluxo (sem enviar mensagem ainda)
      await this.prisma.contactFlowState.update({
        where: { id: flowState.id },
        data: {
          isActive: false,
          awaitingInput: false,
          updatedAt: new Date(),
        },
      });

      // Buscar e fechar ticket relacionado
      try {
        const activeTicket = await this.prisma.ticket.findFirst({
          where: {
            companyId: flowState.companyId,
            contactId: flowState.contactId,
            messagingSessionId: flowState.messagingSessionId,
            status: {
              in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
            },
          },
        });

        if (activeTicket) {
          const now = new Date();

          // Fechar o ticket
          await this.prisma.ticket.update({
            where: { id: activeTicket.id },
            data: {
              status: 'CLOSED',
              closedAt: now,
              updatedAt: now,
            },
          });

          // Registrar no histórico
          try {
            await this.prisma.ticketHistory.create({
              data: {
                ticketId: activeTicket.id,
                action: 'AUTO_CLOSED',
                toValue: 'CLOSED',
                comment:
                  'Ticket fechado automaticamente por inatividade do fluxo',
              },
            });
          } catch (historyError) {
            this.logger.warn(
              `Não foi possível criar histórico para ticket ${activeTicket.id}:`,
              historyError.message,
            );
          }

          ticketsToClose.push(activeTicket.id);
          this.logger.log(
            `🎫 Ticket ${activeTicket.id} fechado por inatividade do fluxo`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Erro ao fechar ticket durante inatividade do fluxo ${flowState.id}:`,
          error,
        );
      }

      // Enviar mensagem de inatividade
      try {
        await this.sendClosingMessage(
          flowState.contact.messagingSessionId,
          flowState.companyId,
          inactivityMessage,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao enviar mensagem de inatividade para ${flowState.contact.messagingSessionId}:`,
          error,
        );
      }
    }

    if (ticketsToClose.length > 0) {
      this.logger.log(
        `🎯 Total de tickets fechados por inatividade de fluxo: ${ticketsToClose.length}`,
      );
    }
  }

  /**
   * 🔍 Verificar comandos especiais do usuário
   */
  private checkSpecialCommands(userMessage: string): string | null {
    const message = userMessage.toLowerCase().trim();

    // Comandos de menu/navegação
    if (
      message.includes('menu') ||
      message.includes('opçõ') ||
      message.includes('início')
    ) {
      return 'menu';
    }

    // Comandos de recomeço
    if (
      message.includes('recomeçar') ||
      message.includes('reiniciar') ||
      message.includes('começar')
    ) {
      return 'restart';
    }

    // Comandos de atendimento humano
    if (
      message.includes('atendimento') ||
      message.includes('humano') ||
      message.includes('atendente')
    ) {
      return 'human';
    }

    // Comandos de ajuda
    if (
      message.includes('ajuda') ||
      message.includes('help') ||
      message === '?'
    ) {
      return 'help';
    }

    return null;
  }

  /**
   * 🎯 Lidar com comandos especiais
   */
  private async handleSpecialCommand(
    command: string,
    companyId: string,
    messagingSessionId: string,
    contactId: string,
  ): Promise<FlowExecutionResult> {
    try {
      switch (command) {
        case 'menu':
        case 'restart': {
          // Usar o novo método handleMenuCommand
          return await this.handleMenuCommand(
            companyId,
            messagingSessionId,
            contactId,
          );
        }

        case 'human': {
          // Solicitar atendimento humano
          // Verificar se está dentro do horário e dar informações adequadas
          let hoursInfo = '';
          if (companyId) {
            try {
              const isBusinessOpen =
                await this.businessHoursService.isBusinessOpen(
                  companyId,
                  new Date(),
                );

              if (isBusinessOpen) {
                hoursInfo =
                  '\n\n✅ **Estamos Online!** Nossa equipe está disponível agora.';
              } else {
                // Usar o método centralizado para informações de horário
                const businessHours =
                  await this.businessHoursService.getBusinessHours(companyId);

                const daysOfWeek = [
                  'Domingo',
                  'Segunda-feira',
                  'Terça-feira',
                  'Quarta-feira',
                  'Quinta-feira',
                  'Sexta-feira',
                  'Sábado',
                ];

                let hoursMessage = '';
                if (businessHours && businessHours.length > 0) {
                  const activeHours = businessHours
                    .filter((h) => h.isActive)
                    .map((h) => {
                      const dayName = daysOfWeek[h.dayOfWeek];
                      let timeRange = `${h.startTime} às ${h.endTime}`;
                      if (h.breakStart && h.breakEnd) {
                        timeRange += ` (Intervalo: ${h.breakStart} às ${h.breakEnd})`;
                      }
                      return `• ${dayName}: ${timeRange}`;
                    });

                  hoursMessage =
                    activeHours.length > 0
                      ? activeHours.join('\n')
                      : '• Verifique nossos horários de funcionamento';
                } else {
                  hoursMessage = `• Segunda a Sexta: 08:00 às 17:00
• Sábado: 08:00 às 12:00
• Domingo: Fechado`;
                }

                const nextBusinessTime =
                  await this.businessHoursService.getNextBusinessTime(
                    companyId,
                  );

                let timeMessage = '';
                if (nextBusinessTime) {
                  const nextTimeFormatted = nextBusinessTime.toLocaleString(
                    'pt-BR',
                    {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  );
                  timeMessage = `\n\n📅 **Próximo Atendimento:** ${nextTimeFormatted}`;
                }

                hoursInfo = `\n\n⏰ **Horário de Funcionamento:**
${hoursMessage}${timeMessage}`;
              }
            } catch (error) {
              this.logger.error(
                'Erro ao verificar horário no comando human:',
                error,
              );
              hoursInfo = `\n\n⏰ **Horário de Atendimento:**
• Segunda a Sexta: 08:00 às 17:00
• Sábado: 08:00 às 12:00
• Domingo: Fechado`;
            }
          }

          return {
            success: true,
            response: `👥 **Transferência para Atendimento Humano**

Entendi que você precisa falar com um de nossos atendentes.${hoursInfo}

📝 Se estivermos fora do horário, deixe sua mensagem que retornaremos no próximo horário útil!

Como posso conectar você com nossa equipe? Digite sua solicitação:`,
          };
        }

        case 'help': {
          return {
            success: true,
            response: `❓ **Central de Ajuda**

Aqui estão os comandos que você pode usar:

🏠 **menu** - Voltar ao menu principal
🔄 **recomeçar** - Reiniciar conversa
👥 **atendimento** - Falar com humano
❓ **ajuda** - Ver esta mensagem

📝 **Dica:** Você pode digitar suas dúvidas diretamente que tentarei ajudar da melhor forma!

O que você gostaria de fazer agora?`,
          };
        }

        default:
          return { success: false };
      }
    } catch (error) {
      this.logger.error('Erro ao processar comando especial:', error);
      return { success: false };
    }
  }

  /**
   * 📋 Executar nó de menu - mostra opções e aguarda escolha do usuário
   */
  private async executeMenuNode(
    flowStateId: string,
    node: FlowNode,
  ): Promise<FlowExecutionResult> {
    try {
      const menuData = node.data;

      // 1. Construir mensagem do menu
      let response = menuData.message || menuData.label || 'Escolha uma opção:';

      // 2. Adicionar opções se configurado para mostrar
      if (
        menuData.showOptions !== false &&
        menuData.options &&
        Array.isArray(menuData.options) &&
        menuData.options.length > 0
      ) {
        response += '\n\n';
        menuData.options.forEach((option: any) => {
          response += `${option.key} - ${option.text}\n`;
        });
      }

      // 3. Adicionar instrução se necessário
      if (menuData.instruction && typeof menuData.instruction === 'string') {
        response += `\n${menuData.instruction}`;
      } else if (
        menuData.options &&
        Array.isArray(menuData.options) &&
        menuData.options.length > 0
      ) {
        response += '\nDigite o número ou texto da opção desejada.';
      }

      // 4. Aguardar entrada do usuário
      await this.updateFlowState(flowStateId, node.id, {}, true);

      this.logger.debug(`Menu executado: ${node.id} - ${menuData.label}`);

      return {
        success: true,
        response,
        nextNode: node,
        awaitingInput: true,
      };
    } catch (error) {
      this.logger.error(`Erro ao executar nó menu ${node.id}:`, error);
      return {
        success: false,
        response: 'Erro interno. Digite *menu* para tentar novamente.',
      };
    }
  }

  /**
   * 🎯 Processar entrada do usuário em nó de menu
   */
  private async processMenuInput(
    flowState: ContactFlowState,
    userInput: string,
    menuNode: FlowNode,
    flowData: ChatFlow,
    companyId: string,
  ): Promise<FlowExecutionResult> {
    const menuData = menuNode.data;
    const input = userInput.trim();
    const inputLower = input.toLowerCase();

    if (
      !menuData.options ||
      !Array.isArray(menuData.options) ||
      menuData.options.length === 0
    ) {
      // Menu sem opções - continuar para próximo nó
      const nextNode = this.getNextNode(menuNode, flowData);
      if (nextNode) {
        return await this.executeNode(
          flowState.id,
          nextNode,
          flowData,
          companyId,
        );
      }
      return await this.handleEndOfFlow(flowState, flowData);
    }

    // 1. Buscar opção por key exata
    let selectedOption = menuData.options.find((opt: any) =>
      menuData.caseSensitive
        ? opt.key === input
        : opt.key.toLowerCase() === inputLower,
    );

    // 2. Se não encontrou e permite busca inteligente, tentar por texto
    if (!selectedOption && menuData.allowFreeText !== false) {
      selectedOption = menuData.options.find((opt: any) => {
        const optionTextLower = opt.text.toLowerCase();
        const optionValueLower = (opt.value || '').toLowerCase();
        const optKey = String(opt.key || '').toLowerCase();

        return (
          optionTextLower.includes(inputLower) ||
          inputLower.includes(optKey) ||
          optionValueLower.includes(inputLower)
        );
      });
    }

    if (selectedOption) {
      // 3. Salvar escolha nas variáveis
      const variables: FlowVariables = JSON.parse(
        flowState.variables || '{}',
      ) as FlowVariables;
      variables[`menu_${menuNode.id}`] = {
        selectedKey: selectedOption.key,
        selectedText: selectedOption.text,
        selectedValue: selectedOption.value || selectedOption.text,
        userInput: userInput,
        timestamp: new Date().toISOString(),
      };

      // 4. Determinar próximo nó
      let nextNode: FlowNode | null = null;

      // Se a opção tem nextNodeId específico, usar ele
      if (selectedOption.nextNodeId) {
        nextNode =
          flowData.nodes.find((n) => n.id === selectedOption.nextNodeId) ||
          null;
      }

      // Se não tem nextNodeId, usar conexão padrão do menu
      if (!nextNode) {
        nextNode = this.getNextNode(menuNode, flowData);
      }

      if (nextNode) {
        await this.updateFlowState(flowState.id, nextNode.id, variables, false);

        // Log da escolha
        this.logger.debug(
          `Menu ${menuNode.id}: Usuário escolheu "${selectedOption.key}" → nó ${nextNode.id}`,
        );

        // Executar próximo nó
        return await this.executeNode(
          flowState.id,
          nextNode,
          flowData,
          companyId,
        );
      } else {
        // Fim do fluxo
        await this.updateFlowState(flowState.id, menuNode.id, variables, false);
        return await this.handleEndOfFlow(
          flowState,
          flowData,
          `✅ Você escolheu: ${selectedOption.text}`,
        );
      }
    }

    // 5. Opção inválida - repetir menu
    const invalidMessage =
      (typeof menuData.invalidMessage === 'string'
        ? menuData.invalidMessage
        : undefined) ||
      `❌ Opção inválida! Por favor, escolha uma das opções disponíveis:`;

    let response = invalidMessage + '\n\n';

    if (
      menuData.options &&
      Array.isArray(menuData.options) &&
      menuData.options.length > 0
    ) {
      menuData.options.forEach((option: any) => {
        response += `${option.key} - ${option.text}\n`;
      });
      response += '\nDigite o número ou texto da opção desejada.';
    }

    // Manter no mesmo nó aguardando nova entrada
    await this.updateFlowState(flowState.id, menuNode.id, {}, true);

    this.logger.debug(`Menu ${menuNode.id}: Opção inválida "${userInput}"`);

    return {
      success: true,
      response,
      nextNode: menuNode,
      awaitingInput: true,
    };
  }

  /**
   * 🔍 Buscar fluxo que contém menu principal
   */
  async handleMenuCommand(
    companyId: string,
    messagingSessionId: string,
    contactId: string,
  ): Promise<FlowExecutionResult> {
    try {
      // 1. Finalizar fluxos ativos
      await this.finishActiveFlow(companyId, messagingSessionId, contactId);

      // 2. Buscar fluxo com menu principal
      const flowsWithMenu = await this.prisma.chatFlow.findMany({
        where: {
          companyId,
          isActive: true,
        },
      });

      for (const flow of flowsWithMenu) {
        const flowNodes = JSON.parse(flow.nodes) as FlowNode[];

        // Procurar nó de menu principal
        const mainMenuNode = flowNodes.find(
          (node) =>
            node.type === 'mainMenu' ||
            (node.type === 'menu' && node.data?.isMainMenu === true),
        );

        if (mainMenuNode) {
          // Encontrou menu principal - iniciar fluxo neste nó
          return await this.startFlowFromNode(
            companyId,
            messagingSessionId,
            contactId,
            flow.id,
            mainMenuNode.id,
          );
        }
      }

      // 3. Fallback: procurar qualquer menu
      for (const flow of flowsWithMenu) {
        const flowNodes = JSON.parse(flow.nodes) as FlowNode[];
        const anyMenuNode = flowNodes.find(
          (node) => node.type === 'menu' || node.type === 'mainMenu',
        );

        if (anyMenuNode) {
          return await this.startFlowFromNode(
            companyId,
            messagingSessionId,
            contactId,
            flow.id,
            anyMenuNode.id,
          );
        }
      }

      // 4. Menu hardcoded como último recurso
      return this.getDefaultMenuResponse();
    } catch (error) {
      this.logger.error('Erro ao processar comando menu:', error);
      return this.getDefaultMenuResponse();
    }
  }

  /**
   * 🚀 Iniciar fluxo em nó específico
   */
  private async startFlowFromNode(
    companyId: string,
    messagingSessionId: string,
    contactId: string,
    flowId: string,
    nodeId: string,
  ): Promise<FlowExecutionResult> {
    const flow = await this.prisma.chatFlow.findUnique({
      where: { id: flowId },
    });

    if (!flow) {
      return this.getDefaultMenuResponse();
    }

    const flowData: ChatFlow = {
      id: flow.id,
      nodes: JSON.parse(flow.nodes),
      edges: JSON.parse(flow.edges),
      triggers: JSON.parse(flow.triggers),
    };

    const startNode = flowData.nodes.find((n) => n.id === nodeId);

    if (!startNode) {
      return this.getDefaultMenuResponse();
    }

    // Criar estado do fluxo direto no nó desejado
    const flowState = await this.prisma.contactFlowState.create({
      data: {
        companyId,
        messagingSessionId,
        contactId,
        chatFlowId: flowId,
        currentNodeId: nodeId,
        isActive: true,
        variables: '{}',
        awaitingInput: false,
      },
    });

    this.logger.debug(
      `Fluxo iniciado no nó ${nodeId} para contato ${contactId}`,
    );

    // Executar o nó
    return await this.executeNode(flowState.id, startNode, flowData, companyId);
  }

  /**
   * 🏠 Resposta de menu padrão
   */
  private getDefaultMenuResponse(): FlowExecutionResult {
    return {
      success: true,
      response: `🏠 **MENU PRINCIPAL**

1️⃣ Informações
2️⃣ Suporte  
3️⃣ Vendas
4️⃣ Falar com Atendente

Digite o número da opção desejada.

💡 *Comandos disponíveis:*
• Digite *menu* para voltar ao menu
• Digite *atendimento* para falar conosco
• Digite *ajuda* para ver mais opções`,
    };
  }

  /**
   * 🔚 Melhorar tratamento de fim de fluxo
   */
  private async handleEndOfFlow(
    flowState: ContactFlowState,
    flowData: ChatFlow,
    lastResponse?: string,
  ): Promise<FlowExecutionResult> {
    // 1. Verificar se o fluxo atual já tem menu
    const hasMenu = flowData.nodes.some(
      (node) => node.type === 'menu' || node.type === 'mainMenu',
    );

    if (hasMenu) {
      // Já é um fluxo com menu - não redirecionar
      await this.finishFlow(flowState.id);
      return {
        success: true,
        response:
          lastResponse ||
          `✅ Conversa finalizada!

Digite *menu* para ver opções ou *atendimento* para falar conosco.`,
      };
    }

    // 2. Buscar e redirecionar para menu principal
    return await this.handleMenuCommand(
      flowState.companyId,
      flowState.messagingSessionId,
      flowState.contactId,
    );
  }

  /**
   * 🕐 Constrói mensagem de fora do horário consistente com ConversationService
   * Evita duplicação de lógica e mantém as mensagens padronizadas
   */
  private async buildOutOfHoursMessage(companyId: string): Promise<string> {
    try {
      // Buscar horários reais da empresa para exibir na mensagem
      const businessHours =
        await this.businessHoursService.getBusinessHours(companyId);

      // Buscar próximo horário de funcionamento
      const nextBusinessTime =
        await this.businessHoursService.getNextBusinessTime(companyId);

      // Mapear dias da semana (igual ao ConversationService)
      const daysOfWeek = [
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado',
      ];

      let hoursMessage = '';

      if (businessHours && businessHours.length > 0) {
        const activeHours = businessHours
          .filter((h) => h.isActive)
          .map((h) => {
            const dayName = daysOfWeek[h.dayOfWeek];
            let timeRange = `${h.startTime} às ${h.endTime}`;

            // Adicionar intervalo se houver
            if (h.breakStart && h.breakEnd) {
              timeRange += ` (Intervalo: ${h.breakStart} às ${h.breakEnd})`;
            }

            return `• ${dayName}: ${timeRange}`;
          });

        if (activeHours.length > 0) {
          hoursMessage = activeHours.join('\n');
        } else {
          hoursMessage = '• Verifique nossos horários de funcionamento';
        }
      } else {
        // Fallback se não houver horários configurados
        hoursMessage = `• Segunda a Sexta: 08:00 às 17:00
• Sábado: 08:00 às 12:00
• Domingo: Fechado`;
      }

      let timeMessage = '';
      if (nextBusinessTime) {
        const nextTimeFormatted = nextBusinessTime.toLocaleString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        timeMessage = `\n\n📅 **Próximo Atendimento:** ${nextTimeFormatted}`;
      }

      return `🕐 **Fora do Horário de Atendimento**

Olá! Nosso atendimento humano não está disponível no momento.

⏰ **Horário de Funcionamento:**
${hoursMessage}${timeMessage}

📝 **Deixe sua mensagem** que retornaremos no próximo horário útil!

Ou continue usando nosso atendimento automático digitando *menu* para ver as opções disponíveis.`;
    } catch (error) {
      this.logger.error(
        'Erro ao construir mensagem de fora do horário:',
        error,
      );

      // Fallback simples em caso de erro
      return `🕐 **Fora do Horário de Atendimento**

Olá! Nosso atendimento humano não está disponível no momento.

⏰ **Horário de Funcionamento:**
• Segunda a Sexta: 08:00 às 17:00
• Sábado: 08:00 às 12:00
• Domingo: Fechado

📝 **Deixe sua mensagem** que retornaremos no próximo horário útil!

Ou continue usando nosso atendimento automático digitando *menu* para ver as opções disponíveis.`;
    }
  }
}
