import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
import { SessionGateway } from '../util/session.gateway';
import { MessageQueueData } from './interfaces/dtos-que';

@Injectable()
export class MessageQueueService implements OnModuleInit {
  private readonly logger = new Logger(MessageQueueService.name);
  constructor(
    @InjectQueue('message-delivery') private messageQueue: Queue,
    private readonly configService: ConfigService,
    private readonly sessionGateway: SessionGateway, // ✅ Injeção simples, sem forwardRef
  ) {}
  async onModuleInit() {
    this.logger.log('Message Queue Service inicializado'); // Configurar processamento de jobs
    void this.messageQueue.process(
      'deliver-message',
      async (job: Job<MessageQueueData>) => {
        return this.processMessageDelivery(job);
      },
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
  private async processMessageDelivery(
    job: Job<MessageQueueData>,
  ): Promise<void> {
    const messageData: MessageQueueData = job.data;

    try {
      this.logger.debug(
        `Processando mensagem: ${messageData.eventType} para sessão ${messageData.sessionId}`,
      );

      // 🎯 ENTREGA REAL via SessionGateway
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
   * 🎯 ENTREGA REAL da mensagem via SessionGateway
   */
  private async deliverMessage(messageData: MessageQueueData): Promise<void> {
    switch (messageData.eventType) {
      case 'qr-code':
        if (messageData.data.qrCode) {
          this.sessionGateway.emitQRCode(
            messageData.sessionId,
            messageData.data.qrCode,
            messageData.companyId,
          );
        }
        break;

      case 'qr-code-image':
        if (messageData.data.qrCodeBase64) {
          this.sessionGateway.emitQRCodeBase64(
            messageData.sessionId,
            messageData.data.qrCodeBase64,
            messageData.companyId,
          );
        }
        break;

      case 'session-status':
        if (messageData.data.status) {
          this.sessionGateway.emitSessionStatusChange(
            messageData.sessionId,
            messageData.data.status,
            messageData.companyId,
            messageData.data.clientInfo,
          );
        }
        break;

      case 'new-message':
        if (messageData.data.message) {
          this.sessionGateway.emitNewMessage(
            messageData.sessionId,
            messageData.data.message,
            messageData.companyId,
          );
        }
        break;
      case 'session-error':
        if (messageData.data.error) {
          this.sessionGateway.emitError(
            messageData.sessionId,
            messageData.data.error,
            messageData.companyId,
          );
        }
        break;
      case 'session-created':
        if (messageData.data.session) {
          this.sessionGateway.emitSessionCreated(
            messageData.data.session,
            messageData.companyId,
          );
        }
        break;

      case 'session-removed':
        this.sessionGateway.emitSessionRemoved(
          messageData.sessionId,
          messageData.companyId,
        );
        break;

      default:
        this.logger.warn(
          `Tipo de evento desconhecido: ${String(messageData.eventType)}`,
        );
    }

    // Simular pequeno delay para processamento
    await new Promise((resolve) => setTimeout(resolve, 10));
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
