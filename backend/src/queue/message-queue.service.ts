/* eslint-disable prettier/prettier */
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';

export interface MessageQueueData {
  sessionId: string;
  companyId: string;
  clientId: string;
  eventType: 'qr-code' | 'session-status' | 'new-message' | 'session-error';
  data: any;
  timestamp: Date;
  retryCount?: number;
  priority?: number;
}

@Injectable()
export class MessageQueueService implements OnModuleInit {
  private readonly logger = new Logger(MessageQueueService.name);

  constructor(
    @InjectQueue('message-delivery') private messageQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Message Queue Service inicializado');

    // Configurar processamento de jobs
    this.messageQueue.process(
      'deliver-message',
      this.processMessageDelivery.bind(this),
    );

    // Limpar jobs antigos na inicialização
    await this.messageQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await this.messageQueue.clean(24 * 60 * 60 * 1000, 'failed');
  }

  /**
   * Adiciona mensagem à fila para entrega garantida
   */
  async queueMessage(messageData: MessageQueueData): Promise<void> {
    try {
      const jobOptions = {
        priority: messageData.priority || 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      };

      await this.messageQueue.add('deliver-message', messageData, jobOptions);

      this.logger.debug(
        `Mensagem adicionada à fila: ${messageData.eventType} para sessão ${messageData.sessionId}`,
      );
    } catch (error) {
      this.logger.error('Erro ao adicionar mensagem à fila:', error);
      throw error;
    }
  }

  /**
   * Processa a entrega de mensagens
   */
  private async processMessageDelivery(job: any): Promise<void> {
    const messageData: MessageQueueData = job.data;

    try {
      this.logger.debug(
        `Processando mensagem: ${messageData.eventType} para sessão ${messageData.sessionId}`,
      );

      // Aqui você injeta o SessionGateway para entregar a mensagem
      // Por enquanto vamos simular a entrega
      await this.deliverMessage(messageData);

      this.logger.debug(
        `Mensagem entregue com sucesso: ${messageData.eventType}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem ${messageData.eventType}:`,
        error,
      );
      throw error; // Permite retry automático do Bull
    }
  }

  /**
   * Simula entrega da mensagem (será substituído pela integração real)
   */
  private async deliverMessage(messageData: MessageQueueData): Promise<void> {
    // Aqui você faria a entrega real via Socket.IO
    // Por exemplo: this.sessionGateway.deliverMessage(messageData);

    // Por enquanto, apenas simula um delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Obtém estatísticas da fila
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.messageQueue.getWaiting(),
      this.messageQueue.getActive(),
      this.messageQueue.getCompleted(),
      this.messageQueue.getFailed(),
      this.messageQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Limpa a fila
   */
  async clearQueue(): Promise<void> {
    await this.messageQueue.empty();
    this.logger.log('Fila de mensagens limpa');
  }

  /**
   * Pausa o processamento da fila
   */
  async pauseQueue(): Promise<void> {
    await this.messageQueue.pause();
    this.logger.log('Processamento da fila pausado');
  }

  /**
   * Resume o processamento da fila
   */
  async resumeQueue(): Promise<void> {
    await this.messageQueue.resume();
    this.logger.log('Processamento da fila resumido');
  }
}
