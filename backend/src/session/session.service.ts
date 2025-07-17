import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as qrcodeTerminal from 'qrcode-terminal';
import { Client, LocalAuth, Message, MessageTypes } from 'whatsapp-web.js';
import { ConversationService } from '../conversation/conversation.service';
import { IgnoredContactsService } from '../ignored-contacts/ignored-contacts.service';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessageQueueService } from '../queue/message-queue.service';
import { SessionGateway } from '../util/session.gateway';
import { CreateSessionDto } from './dto/create-session.dto';
import { DatabaseSession } from './dto/database-dtos';
import { Session } from './entities/session.entity';

/**
 * 🔥 NOVO: Tipo para dados de mídia
 */
interface MediaData {
  fileName: string;
  mimeType: string;
  base64Data: string;
  size: number;
}

/**
 * Gerenciador de sessões de mensagens multi-plataforma
 * Atualmente suporta WhatsApp via whatsapp-web.js
 */
@Injectable()
export class SessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionService.name);
  private sessions = new Map<string, { client: Client; session: Session }>();
  private readonly sessionsPath = path.join(process.cwd(), 'sessions');
  private qrCodes = new Map<string, string>();

  // 🔄 SISTEMA DE AUTO-RECONEXÃO
  private readonly reconnectionAttempts = new Map<string, number>();
  private readonly reconnectionTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly maxReconnectionAttempts = 5;
  private readonly reconnectionDelay = 30000; // 30 segundos

  // 🔥 NOVO: Rastrear mensagens enviadas pelo sistema para evitar duplicação
  private readonly sentMessageIds = new Set<string>();
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageQueueService: MessageQueueService,
    private readonly conversationService: ConversationService,
    private readonly ignoredContactsService: IgnoredContactsService,
    private readonly mediaService: MediaService,
    @Inject(forwardRef(() => SessionGateway))
    private readonly sessionGateway: SessionGateway,
  ) {}

  async onModuleInit() {
    await this.initializeSessionsDirectory();
    await this.loadExistingSessions();
    // 🔄 Os métodos de monitoramento agora usam @Cron decorators
    this.logger.log(
      '🔄 Serviço de sessão inicializado - monitoramento via Cron',
    );
  }

  // 🔄 SISTEMA DE MONITORAMENTO E AUTO-RECONEXÃO
  // Executa a cada minuto (0 * * * * * = a cada minuto no segundo 0)
  @Cron('0 * * * * *', {
    name: 'session-heartbeat-monitor',
  })
  private async handleSessionHeartbeat(): Promise<void> {
    try {
      await this.checkSessionsHealth();
    } catch (error) {
      this.logger.error('Erro no monitor de heartbeat:', error);
    }
  }

  // 🔥 NOVO: Limpeza periódica de IDs de mensagens enviadas
  // Executa a cada 5 minutos (0 */5 * * * * = a cada 5 minutos no segundo 0)
  @Cron('0 */5 * * * *', {
    name: 'sent-message-cleanup',
  })
  private handleSentMessageCleanup(): void {
    try {
      // Limpar IDs antigos para evitar vazamento de memória
      this.sentMessageIds.clear();
      this.logger.debug('🧹 Cache de mensagens enviadas limpo');
    } catch (error) {
      this.logger.error('Erro na limpeza de mensagens:', error);
    }
  }

  private async checkSessionsHealth(): Promise<void> {
    for (const [sessionId, sessionData] of this.sessions) {
      try {
        const { session } = sessionData;
        const timeSinceLastActivity =
          Date.now() - session.lastActiveAt.getTime();

        // Se a sessão está inativa há mais de 5 minutos, verificar se ainda está conectada
        if (timeSinceLastActivity > 5 * 60 * 1000) {
          await this.pingSession(sessionId);
        }
      } catch (error) {
        this.logger.error(
          `Erro ao verificar saúde da sessão ${sessionId}:`,
          error,
        );
      }
    }

    // 🧹 Limpar sessões órfãs (que existem no banco mas não estão na memória)
    await this.cleanupOrphanedSessions();
  }

  private async cleanupOrphanedSessions(): Promise<void> {
    try {
      // Buscar todas as sessões ativas no banco
      const dbSessions = await this.prisma.messagingSession.findMany({
        where: {
          isActive: true,
        },
      });

      // Verificar quais sessões do banco não estão na memória
      const orphanedSessions = dbSessions.filter(
        (dbSession) => !this.sessions.has(dbSession.id),
      );

      if (orphanedSessions.length > 0) {
        this.logger.warn(
          `🧹 Encontradas ${orphanedSessions.length} sessões órfãs no banco`,
        );

        for (const orphanedSession of orphanedSessions) {
          const timeSinceLastSeen = orphanedSession.lastSeen
            ? Date.now() - orphanedSession.lastSeen.getTime()
            : Date.now() - orphanedSession.updatedAt.getTime();

          // Se a sessão está órfã há mais de 10 minutos, marcar como inativa
          if (timeSinceLastSeen > 10 * 60 * 1000) {
            this.logger.warn(
              `🧹 Marcando sessão órfã ${orphanedSession.id} como inativa`,
            );

            await this.updateSessionInDatabase(orphanedSession.id, {
              status: 'ORPHANED' as any,
              isActive: false,
            });
          } else {
            // Tentar restaurar a sessão
            this.logger.log(
              `🔄 Tentando restaurar sessão órfã ${orphanedSession.id}`,
            );
            await this.restoreSession(orphanedSession);
          }
        }
      }
    } catch (error) {
      this.logger.error('Erro ao limpar sessões órfãs:', error);
    }
  }

  private async pingSession(sessionId: string): Promise<void> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) return;

    try {
      const { client, session } = sessionData;

      // Tentar obter informações básicas do cliente
      const state = await client.getState();

      if (state === ('CONNECTED' as any)) {
        session.lastActiveAt = new Date();
        this.logger.debug(`✅ Sessão ${sessionId} está saudável`);
      } else {
        this.logger.warn(
          `⚠️ Sessão ${sessionId} não está conectada (estado: ${state})`,
        );
        this.attemptReconnection(sessionId);
      }
    } catch (error) {
      this.logger.error(
        `❌ Erro ao verificar ping da sessão ${sessionId}:`,
        error,
      );
      this.attemptReconnection(sessionId);
    }
  }

  private attemptReconnection(sessionId: string): void {
    const currentAttempts = this.reconnectionAttempts.get(sessionId) || 0;

    if (currentAttempts >= this.maxReconnectionAttempts) {
      this.logger.error(
        `🚫 Máximo de tentativas de reconexão atingido para sessão ${sessionId}`,
      );
      return;
    }

    this.reconnectionAttempts.set(sessionId, currentAttempts + 1);

    // Limpar timeout anterior se existir
    const existingTimeout = this.reconnectionTimeouts.get(sessionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Calcular delay com backoff exponencial
    const delay = this.reconnectionDelay * Math.pow(2, currentAttempts);

    this.logger.log(
      `🔄 Tentativa de reconexão ${currentAttempts + 1}/${this.maxReconnectionAttempts} para sessão ${sessionId} em ${delay}ms`,
    );

    const timeout = setTimeout(() => {
      this.reconnectSession(sessionId).catch((error) => {
        this.logger.error(
          `Erro na tentativa de reconexão da sessão ${sessionId}:`,
          error,
        );
      });
    }, delay);

    this.reconnectionTimeouts.set(sessionId, timeout);
  }

  private async reconnectSession(sessionId: string): Promise<void> {
    try {
      this.logger.log(`🔄 Iniciando reconexão da sessão ${sessionId}`);

      // Buscar dados da sessão no banco
      const dbSession = await this.prisma.messagingSession.findFirst({
        where: { id: sessionId },
      });

      if (!dbSession) {
        this.logger.error(
          `Sessão ${sessionId} não encontrada no banco de dados`,
        );
        return;
      }

      // Destruir cliente atual se existir
      const existingSessionData = this.sessions.get(sessionId);
      if (existingSessionData) {
        try {
          await existingSessionData.client.destroy();
        } catch (error) {
          this.logger.warn(
            `Erro ao destruir cliente existente da sessão ${sessionId}:`,
            error,
          );
        }
        this.sessions.delete(sessionId);
      }

      // Criar nova sessão
      const session: Session = {
        id: sessionId,
        name: dbSession.name,
        status: 'reconnecting',
        createdAt: dbSession.createdAt,
        lastActiveAt: new Date(),
        sessionPath: path.join(this.sessionsPath, sessionId),
      };

      const client = this.createWhatsAppClient(sessionId);
      this.setupClientEventHandlers(client, session, dbSession.companyId);

      // Adicionar handler específico para reconexão bem-sucedida
      client.once('ready', () => {
        this.logger.log(`✅ Reconexão bem-sucedida para sessão ${sessionId}`);
        this.reconnectionAttempts.delete(sessionId);

        const timeout = this.reconnectionTimeouts.get(sessionId);
        if (timeout) {
          clearTimeout(timeout);
          this.reconnectionTimeouts.delete(sessionId);
        }
      });

      this.sessions.set(sessionId, { client, session });

      // Atualizar status no banco
      await this.updateSessionInDatabase(sessionId, {
        status: 'RECONNECTING' as any,
        isActive: true,
      });

      await client.initialize();
    } catch (error) {
      this.logger.error(`Erro ao reconectar sessão ${sessionId}:`, error);

      // Se falhou, tentar novamente
      this.attemptReconnection(sessionId);
    }
  }

  // ==================== LIFECYCLE METHODS ====================

  private async initializeSessionsDirectory(): Promise<void> {
    try {
      await fs.ensureDir(this.sessionsPath);
      this.logger.log(
        `Diretório de sessões inicializado: ${this.sessionsPath}`,
      );
    } catch (error) {
      this.logger.error('Erro ao inicializar diretório de sessões:', error);
    }
  }

  private async loadExistingSessions(): Promise<void> {
    try {
      const dbSessions = await this.prisma.messagingSession.findMany();
      this.logger.log(`Carregando ${dbSessions.length} sessões ativas`);

      for (const dbSession of dbSessions) {
        // O WhatsApp Web.js adiciona prefixo "session-" ao nome do diretório
        const sessionDirWithPrefix = path.join(
          this.sessionsPath,
          `session-${dbSession.id}`,
        );
        const sessionDirWithoutPrefix = path.join(
          this.sessionsPath,
          dbSession.id,
        );

        // Verificar qual diretório existe (com ou sem prefixo)
        const pathExistsWithPrefix = await fs.pathExists(sessionDirWithPrefix);
        const pathExistsWithoutPrefix = await fs.pathExists(
          sessionDirWithoutPrefix,
        );

        if (pathExistsWithPrefix || pathExistsWithoutPrefix) {
          this.logger.log(`Restaurando sessão: ${dbSession.name}`);
          await this.restoreSession(dbSession);
        } else {
          this.logger.warn(
            `Sessão ${dbSession.id} sem diretório - marcando como inativa`,
          );
          await this.markSessionAsInactive(dbSession.id);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao carregar sessões existentes:', error);
    }
  }

  private async restoreSession(dbSession: DatabaseSession): Promise<void> {
    try {
      const session: Session = {
        id: dbSession.id,
        name: dbSession.name,
        status: 'connecting',
        createdAt: dbSession.createdAt,
        lastActiveAt: dbSession.lastSeen || dbSession.updatedAt,
        sessionPath: path.join(this.sessionsPath, dbSession.id),
      };

      const client = this.createWhatsAppClient(session.id);
      this.setupClientEventHandlers(client, session, dbSession.companyId);

      this.sessions.set(session.id, { client, session });
      await client.initialize();
    } catch (error) {
      this.logger.error(`Erro ao restaurar sessão ${dbSession.id}:`, error);
      await this.markSessionAsInactive(dbSession.id, 'ERROR');
    }
  }

  // ==================== CLIENT CREATION ====================

  private createWhatsAppClient(sessionId: string): Client {
    return new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: this.sessionsPath,
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });
  }

  // ==================== MESSAGE FILTERING ====================
  /**
   * Filtra mensagens com base nas configurações do .env
   * Retorna true se a mensagem deve ser IGNORADA
   */
  private shouldIgnoreMessage(message: Message): boolean {
    // Configurações do .env
    const ignoreTypes =
      process.env.WHATSAPP_IGNORE_MESSAGE_TYPES?.split(',').map((t) =>
        t.trim(),
      ) || [];
    const ignoreBotMessages =
      process.env.WHATSAPP_IGNORE_BOT_MESSAGES === 'true';
    const ignoreEmptyMessages =
      process.env.WHATSAPP_IGNORE_EMPTY_MESSAGES === 'true';

    // 🔥 MODIFICADO: NÃO ignorar mensagens próprias automaticamente
    // Permitir que mensagens enviadas diretamente pelo WhatsApp sejam processadas
    // A distinção será feita durante o salvamento para evitar duplicação

    // 2. Filtrar por tipo de chat
    if (message.from) {
      // Grupos terminam com @g.us
      if (ignoreTypes.includes('group') && message.from.includes('@g.us')) {
        this.logger.debug(`Ignorando mensagem de grupo: ${message.from}`);
        return true;
      }

      // Broadcast/Status terminam com @broadcast
      if (
        ignoreTypes.includes('broadcast') &&
        message.from.includes('@broadcast')
      ) {
        this.logger.debug(`Ignorando mensagem de broadcast: ${message.from}`);
        return true;
      }

      // Status/Histórias são do tipo 'status@broadcast'
      if (
        ignoreTypes.includes('status') &&
        message.from === 'status@broadcast'
      ) {
        this.logger.debug('Ignorando mensagem de status/história');
        return true;
      }
      if (
        ignoreTypes.includes('newsletter') &&
        message.from === '@newsletter'
      ) {
        this.logger.debug('Ignorando mensagem de  newsletter');
        return true;
      }

      // Mensagens de bots (configurável)
      if (
        ignoreBotMessages &&
        message.from.includes('@c.us') &&
        this.isLikelyBot(message)
      ) {
        this.logger.debug(
          `Ignorando mensagem de possível bot: ${message.from}`,
        );
        return true;
      }
    }

    // 3. Filtrar por tipo de mensagem (usando os tipos corretos do whatsapp-web.js)
    if (message.type) {
      // Notificações do sistema
      if (
        ignoreTypes.includes('notification') &&
        ['system', 'notification'].includes(message.type as string)
      ) {
        this.logger.debug('Ignorando notificação do sistema');
        return true;
      }

      // Filtros de mídia (opcional)
      if (
        ignoreTypes.includes('media_document') &&
        message.type === MessageTypes.DOCUMENT
      ) {
        this.logger.debug('Ignorando documento');
        return true;
      }

      if (
        ignoreTypes.includes('media_audio') &&
        ['audio', 'ptt'].includes(message.type as string)
      ) {
        this.logger.debug('Ignorando áudio');
        return true;
      }

      if (
        ignoreTypes.includes('media_video') &&
        message.type === MessageTypes.VIDEO
      ) {
        this.logger.debug('Ignorando vídeo');
        return true;
      }
    }

    // 4. Filtrar mensagens vazias (mas considerar mensagens com mídia como válidas)
    if (
      ignoreEmptyMessages &&
      (!message.body || message.body.trim().length === 0) &&
      !message.hasMedia // 🔥 NOVO: Se tem mídia, não é considerada "vazia"
    ) {
      this.logger.debug('Ignorando mensagem vazia (sem texto e sem mídia)');
      return true;
    }

    return false;
  }

  /**
   * Detecta se uma mensagem parece ser de um bot
   * (heurística simples baseada em padrões comuns)
   */
  private isLikelyBot(message: Message): boolean {
    const body = message.body?.toLowerCase() || '';

    // Padrões comuns de bots
    const botPatterns = [
      /^\/\w+/, // Comandos que começam com /
      /\*.*\*/, // Texto com formatação markdown
      /\bhttps?:\/\/\S+/i, // URLs
      /\b(bot|automatic|automated)\b/i, // Palavras-chave de bot
    ];

    return botPatterns.some((pattern) => pattern.test(body));
  }

  // ==================== EVENT HANDLERS ====================

  private setupClientEventHandlers(
    client: Client,
    session: Session,
    companyId: string,
  ): void {
    client.on('qr', (qr) => {
      void this.handleQRCode(qr, session, companyId);
    });
    client.on('ready', () => {
      void this.handleClientReady(session, companyId);
    });
    client.on('authenticated', () => {
      void this.handleAuthentication(session, companyId);
    });
    client.on('auth_failure', (msg) => {
      void this.handleAuthFailure(msg, session);
    });
    client.on('disconnected', (reason) => {
      void this.handleDisconnection(reason, session, companyId);
    });
    // 🔥 NOVO: message_create captura TODAS as mensagens (incluindo próprias)
    // Usado especificamente para capturar mensagens ENVIADAS pelo próprio usuário
    client.on('message_create', (message) => {
      // Só processar mensagens próprias (fromMe = true)
      if (message.fromMe) {
        this.handleOutgoingMessage(message, session, companyId).catch(
          (error) => {
            this.logger.error(
              `Erro ao processar mensagem enviada da sessão ${session.name}:`,
              error,
            );
          },
        );
      }
    });

    // 🔥 MODIFICADO: message captura apenas mensagens RECEBIDAS (fromMe = false)
    // Usado para capturar mensagens de outros contatos
    client.on('message', (message) => {
      // Só processar mensagens recebidas (fromMe = false)
      if (!message.fromMe) {
        // Aplicar filtro de mensagens antes de processar
        if (!this.shouldIgnoreMessage(message)) {
          this.handleIncomingMessage(message, session, companyId).catch(
            (error) => {
              this.logger.error(
                `Erro ao processar mensagem recebida da sessão ${session.name}:`,
                error,
              );
            },
          );
        }
      }
    });
  }

  private async handleQRCode(
    qr: string,
    session: Session,
    companyId: string,
  ): Promise<void> {
    this.qrCodes.set(session.id, qr);
    session.status = 'qr_ready';

    qrcodeTerminal.generate(qr, { small: true });
    this.logger.log(`QR Code gerado para sessão: ${session.name}`);

    // 🔥 NOVO: Enviar QR Code em tempo real via Socket.IO (latência ultra-baixa)
    try {
      this.logger.debug(
        `🔥 Iniciando envio de QR Code via Socket.IO para sessão ${session.id} (Company: ${companyId})`,
      );

      // // 1. Enviar QR Code string diretamente via Socket.IO
      this.sessionGateway?.emitQRCode(session.id, qr, companyId);
      session.qrCode = qr; // Atualizar sessão com base64

      // // 2. Gerar e enviar QR Code como imagem base64 via Socket.IO
      // const qrCodeDataURL = await QRCode.toDataURL(qr);
      // // Extrair apenas a parte base64 do Data URL
      // const qrCodeBase64 = qrCodeDataURL.replace(
      //   /^data:image\/png;base64,/,
      //   '',
      // );
      // this.sessionGateway?.emitQRCodeBase64(
      //   session.id,
      //   qrCodeBase64,
      //   companyId,
      // );

      // 3. OPCIONAL: Também enviar via queue como backup (para garantia)
      if (process.env.QR_CODE_QUEUE_BACKUP === 'true') {
        await this.queueQRCodeAsBackup(session.id, qr, null, companyId);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao enviar QR Code via Socket.IO para sessão ${session.id}:`,
        error,
      );

      // Fallback: enviar via queue se Socket.IO falhar
      await this.queueQRCodeAsBackup(session.id, qr, null, companyId);
    }

    // Atualizar banco de dados com novo status
    await this.updateSessionInDatabase(session.id, {
      status: 'QR_READY',
      qrCode: qr,
    });
  }

  /**
   * 🔄 Envia QR Code via fila como backup/fallback
   */
  private async queueQRCodeAsBackup(
    sessionId: string,
    qr: string,
    qrCodeBase64: string | null,
    companyId: string,
  ): Promise<void> {
    try {
      // Enviar QR Code string via queue
      await this.messageQueueService.queueMessage({
        sessionId,
        companyId,
        clientId: `system-${sessionId}`,
        eventType: 'qr-code',
        data: { qrCode: qr },
        timestamp: new Date(),
        priority: 2, // Prioridade alta para QR Code
      });

      // Enviar QR Code base64 via queue (se disponível)
      if (qrCodeBase64) {
        await this.messageQueueService.queueMessage({
          sessionId,
          companyId,
          clientId: `system-${sessionId}`,
          eventType: 'qr-code-image',
          data: { qrCodeBase64 },
          timestamp: new Date(),
          priority: 2,
        });
      }

      this.logger.debug(
        `QR Code adicionado à fila como backup para sessão ${sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao adicionar QR Code à fila para sessão ${sessionId}:`,
        error,
      );
    }
  }

  private async handleClientReady(
    session: Session,
    companyId: string,
  ): Promise<void> {
    session.status = 'connected';
    session.lastActiveAt = new Date();
    this.qrCodes.delete(session.id);

    this.logger.log(`Sessão conectada: ${session.name}`);

    // 🔥 NOVO: Notificar frontend via Socket.IO sobre conexão
    try {
      this.sessionGateway?.emitSessionStatusChange(
        session.id,
        'connected',
        companyId,
      );
      this.logger.debug(
        `📡 Status 'connected' enviado via Socket.IO para sessão ${session.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao enviar status via Socket.IO para sessão ${session.id}:`,
        error,
      );
    }

    await this.updateSessionInDatabase(session.id, {
      status: 'CONNECTED',
      isActive: true,
      lastSeen: new Date(),
    });
  }

  private async handleAuthentication(
    session: Session,
    companyId: string,
  ): Promise<void> {
    session.status = 'authenticated';
    this.logger.log(`Sessão autenticada: ${session.name}`);

    // 🔥 NOVO: Notificar frontend via Socket.IO sobre autenticação
    try {
      this.sessionGateway?.emitSessionStatusChange(
        session.id,
        'authenticated',
        companyId,
      );
      this.logger.debug(
        `📡 Status 'authenticated' enviado via Socket.IO para sessão ${session.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao enviar status via Socket.IO para sessão ${session.id}:`,
        error,
      );
    }

    await this.updateSessionInDatabase(session.id, {
      status: 'AUTHENTICATED',
      lastSeen: new Date(),
    });
  }

  private async handleAuthFailure(
    msg: string,
    session: Session,
  ): Promise<void> {
    session.status = 'auth_failure';
    this.logger.error(
      `Falha de autenticação na sessão ${session.name}: ${msg}`,
    );

    await this.updateSessionInDatabase(session.id, {
      status: 'AUTH_FAILURE',
      isActive: false,
    });

    // 🔄 NOVO: Tentar reconectar após falha de autenticação
    // Aguardar um pouco mais antes de tentar reconectar
    this.logger.log(
      `🔄 Agendando reconexão após falha de autenticação para sessão ${session.id}`,
    );

    setTimeout(() => {
      this.attemptReconnection(session.id);
    }, 60000); // 1 minuto de espera
  }

  private async handleDisconnection(
    reason: string,
    session: Session,
    companyId: string,
  ): Promise<void> {
    session.status = 'disconnected';
    this.qrCodes.delete(session.id);

    this.logger.warn(`Sessão desconectada ${session.name}: ${reason}`);

    // 🔥 NOVO: Notificar frontend via Socket.IO sobre desconexão
    try {
      this.sessionGateway?.emitSessionStatusChange(
        session.id,
        'disconnected',
        companyId,
      );
      this.logger.debug(
        `📡 Status 'disconnected' enviado via Socket.IO para sessão ${session.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao enviar status via Socket.IO para sessão ${session.id}:`,
        error,
      );
    }

    await this.updateSessionInDatabase(session.id, {
      status: 'DISCONNECTED',
      isActive: false,
    });

    // 🔄 NOVO: Iniciar processo de auto-reconexão
    this.logger.log(
      `🔄 Iniciando processo de auto-reconexão para sessão ${session.id}`,
    );
    this.attemptReconnection(session.id);
  }
  /**
   * Processa mensagens recebidas de outros contatos (fromMe = false)
   * Capturadas via client.on('message')
   */
  private async handleIncomingMessage(
    message: Message,
    session: Session,
    companyId: string,
  ): Promise<void> {
    try {
      // 🚫 VERIFICAR SE CONTATO DEVE SER IGNORADO (apenas para mensagens recebidas)
      const phoneNumber = message.from.replace('@c.us', ''); // Remover sufixo do WhatsApp
      const ignoreCheck = await this.ignoredContactsService.shouldIgnoreContact(
        companyId,
        phoneNumber,
        session.id,
        true, // É mensagem do bot
      );

      if (ignoreCheck.shouldIgnore) {
        this.logger.debug(
          `📵 Contato ${phoneNumber} ignorado. Motivo: ${ignoreCheck.reason}`,
        );
        const contactd = await message.getContact();
        const contactName = contactd.pushname || contactd.name || undefined;

        this.logger.debug(
          `📞 Contato ignorado - Phone: ${phoneNumber}, Nome: ${contactName || 'SEM NOME'}, PushName: ${contactd.pushname || 'N/A'}, Name: ${contactd.name || 'N/A'}`,
        );

        // Apenas registra a mensagem no banco mas não processa fluxos ou gera respostas automáticas
        const contact = await this.getOrCreateContact(
          message.from,
          companyId,
          session.id,
          contactName, // <-- Passa o nome do contato
        );
        await this.saveIncomingMessage(
          message,
          session,
          companyId,
          contact.id,
          undefined, // Sem ticket, apenas registra
          null, // Sem mídia para contatos ignorados
        );
        return; // Sair sem processar
      }

      session.lastActiveAt = new Date();
      await this.updateSessionInDatabase(session.id, { lastSeen: new Date() });

      // Buscar ou criar contato (com nome)
      const contactData = await message.getContact();
      const contactName = contactData.pushname || contactData.name || undefined;

      this.logger.debug(
        `📞 Processando contato - Phone: ${message.from}, Nome: ${contactName || 'SEM NOME'}, PushName: ${contactData.pushname || 'N/A'}, Name: ${contactData.name || 'N/A'}`,
      );

      const contact = await this.getOrCreateContact(
        message.from,
        companyId,
        session.id,
        contactName,
      );

      // 🔥 PROCESSAR CONTEÚDO DA MENSAGEM (texto ou mídia)
      let messageContent = message.body || '';
      let mediaData: MediaData | null = null;

      // Se a mensagem tem mídia, processar o arquivo
      if (message.hasMedia) {
        try {
          const media = await message.downloadMedia();

          if (media) {
            // Preparar dados da mídia para salvar diretamente no banco
            mediaData = {
              fileName: media.filename || `media_${message.id._serialized}`,
              mimeType: media.mimetype || 'application/octet-stream',
              base64Data: media.data, // Base64 data já vem pronto
              size: Buffer.from(media.data, 'base64').length,
            };

            // Para mensagens de mídia, usar o nome do arquivo como conteúdo se não há caption
            if (!messageContent && media.filename) {
              messageContent = `[${message.type?.toUpperCase()}] ${media.filename}`;
            }

            this.logger.debug(
              `📎 Mídia processada - Tipo: ${message.type}, Arquivo: ${mediaData.fileName}, Tamanho: ${mediaData.size} bytes`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Erro ao processar mídia da mensagem ${message.id._serialized}:`,
            error,
          );
          // Continuar processamento mesmo se falhar ao baixar mídia
          messageContent = `[${message.type?.toUpperCase()}] Arquivo não pôde ser processado`;
        }
      }

      // 🔥 PROCESSAR mensagem através do sistema de tickets/conversas
      const result = await this.conversationService.processIncomingMessage(
        companyId,
        session.id,
        contact.id,
        messageContent, // Usar conteúdo processado (texto ou descrição de mídia)
      );

      this.logger.debug(
        `Mensagem processada - Ticket: ${result.ticketId}, Fluxo: ${result.shouldStartFlow}, Mídia: ${!!mediaData}`,
      );

      // 🔥 SALVAR mensagem recebida no banco (incluindo mídia)
      await this.saveIncomingMessage(
        message,
        session,
        companyId,
        contact.id,
        result.ticketId,
        mediaData, // Passar dados da mídia
      );

      // Se houve resposta do fluxo, enviar de volta
      if (result.flowResponse || result.mediaUrl) {
        const client = this.sessions.get(session.id)?.client;
        if (client) {
          // Enviar texto se existir
          if (result.flowResponse) {
            const sentMessage = await client.sendMessage(
              message.from,
              result.flowResponse,
            );
            this.logger.debug(
              `Resposta do fluxo enviada: ${result.flowResponse}`,
            );

            // 🔥 NOVO: Registrar ID da mensagem do bot para evitar duplicação
            if (sentMessage.id?._serialized) {
              this.sentMessageIds.add(sentMessage.id._serialized);
              this.logger.debug(
                `📝 Mensagem do bot registrada no cache: ${sentMessage.id._serialized}`,
              );
            }

            // 🔥 NOVO: Salvar mensagem enviada pelo bot no banco
            await this.saveOutgoingMessage(
              message.from,
              result.flowResponse,
              session,
              companyId,
              contact.id,
              result.ticketId,
              true, // isFromBot = true
              'TEXT', // tipo da mensagem
              false, // isFromUser = false (é do bot)
            );
          }

          // Enviar mídia se existir
          if (result.mediaUrl && result.mediaType) {
            await this.sendMediaMessage(
              client,
              message.from,
              result.mediaUrl,
              result.mediaType,
              result.flowResponse, // Caption opcional
            );

            this.logger.debug(
              `Mídia ${result.mediaType} enviada: ${result.mediaUrl}`,
            );

            // Salvar envio de mídia no banco
            await this.saveOutgoingMessage(
              message.from,
              `[${result.mediaType.toUpperCase()}] ${result.mediaUrl}`,
              session,
              companyId,
              contact.id,
              result.ticketId,
              true, // isFromBot = true
              'MEDIA', // Tipo genérico para mídia
              false, // isFromUser = false (é do bot)
            );
          }
        }
      }

      // 🔥 NOVO: Adicionar mensagem à fila para o frontend (incluindo ticketId)
      await this.queueMessageForFrontend(
        message,
        session,
        companyId,
        result.ticketId,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem da sessão ${session.name}:`,
        error,
      );
    }
  }

  /**
   * 🔥 NOVO: Adiciona mensagem à fila para ser enviada ao frontend
   */
  private async queueMessageForFrontend(
    message: Message,
    session: Session,
    companyId: string,
    ticketId?: string,
  ): Promise<void> {
    try {
      let contactPhoneNumber: string;
      let contactName: string | undefined;

      // Distinguir entre mensagens recebidas e enviadas
      if (message.fromMe) {
        // Mensagem enviada (fromMe = true): usar destinatário (message.to)
        contactPhoneNumber = message.to || message.from;

        // Tentar obter nome do contato destinatário
        try {
          const sessionData = this.sessions.get(session.id);
          if (sessionData?.client) {
            const destinationContact =
              await sessionData.client.getContactById(contactPhoneNumber);
            contactName =
              destinationContact.pushname ||
              destinationContact.name ||
              undefined;
          }
        } catch {
          contactName = undefined;
        }
      } else {
        // Mensagem recebida (fromMe = false): usar remetente (message.from)
        contactPhoneNumber = message.from;
        const contactData = await message.getContact();
        contactName = contactData.pushname || contactData.name || undefined;
      }

      const contact = await this.getOrCreateContact(
        contactPhoneNumber,
        companyId,
        session.id,
        contactName,
      );

      // Preparar dados da mensagem compatíveis com WhatsAppMessage
      const whatsappMessage = {
        id: { _serialized: message.id._serialized },
        body: message.body || '',
        from: message.from,
        to: message.to || session.id,
        timestamp: message.timestamp || Date.now(),
        type: message.type || 'unknown',
        author: message.author,
        hasMedia: message.hasMedia || false,
        // 🔥 NOVO: Campo explícito para identificar mensagens próprias
        isMe: message.fromMe || false,
      };

      // Adicionar à fila com prioridade alta (mensagens são importantes)
      await this.messageQueueService.queueMessage({
        sessionId: session.id,
        companyId,
        clientId: contactPhoneNumber,
        eventType: 'new-message',
        data: {
          message: whatsappMessage,
          session: session,
          ticketId: ticketId,
          contactId: contact.id,
        },
        timestamp: new Date(),
        priority: 1,
      });
    } catch (error) {
      this.logger.error('Erro ao adicionar mensagem à fila:', error);
    }
  }
  private async getOrCreateContact(
    phoneNumber: string,
    companyId: string,
    sessionId: string,
    name?: string, // <-- Novo parâmetro opcional
  ) {
    // Limpar e validar o nome
    const cleanName = name?.trim();
    const validName = cleanName && cleanName.length > 0 ? cleanName : null;

    this.logger.debug(
      `💾 getOrCreateContact - Phone: ${phoneNumber}, Nome original: "${name}", Nome limpo: "${validName}", SessionId: ${sessionId}`,
    );

    const result = await this.prisma.contact.upsert({
      where: {
        companyId_phoneNumber: {
          phoneNumber,
          companyId,
        },
      },
      update: {
        lastMessageAt: new Date(),
        messagingSessionId: sessionId,
        // Sempre atualiza o nome se um nome válido foi fornecido (pode ser uma atualização)
        ...(validName ? { name: validName } : {}),
      },
      create: {
        phoneNumber,
        companyId,
        messagingSessionId: sessionId,
        lastMessageAt: new Date(),
        name: validName || phoneNumber, // Usa nome se fornecido e válido, senão phoneNumber
      },
    });

    this.logger.debug(
      `💾 Contato salvo - ID: ${result.id}, Nome final: "${result.name}", Phone: ${result.phoneNumber}`,
    );

    return result;
  }

  // ==================== PUBLIC API METHODS ====================

  /**
   * Cria uma nova sessão de mensagens
   */
  async create(
    companyId: string,
    createSessionDto: CreateSessionDto,
  ): Promise<Session> {
    const sessionId = createSessionDto.name;

    if (this.sessions.has(sessionId)) {
      throw new Error(`Sessão ${sessionId} já existe`);
    }

    const session: Session = {
      id: sessionId,
      name: createSessionDto.name,
      status: 'initializing',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      sessionPath: path.join(this.sessionsPath, sessionId),
    };

    try {
      // Salva no banco de dados
      await this.prisma.messagingSession.create({
        data: {
          id: sessionId,
          name: createSessionDto.name,
          companyId,
          platform: 'WHATSAPP',
          status: 'INITIALIZING',
          isActive: true,
        },
      });

      // Cria o cliente WhatsApp
      const client = this.createWhatsAppClient(sessionId);
      this.setupClientEventHandlers(client, session, companyId);

      this.sessions.set(sessionId, { client, session });

      // Inicializa o cliente
      await client.initialize();
      this.logger.log(`Sessão criada: ${sessionId}`);

      return session;
    } catch (error) {
      this.logger.error(`Erro ao criar sessão ${sessionId}:`, error);
      await this.cleanup(sessionId);
      throw error;
    }
  }

  /**
   * Remove uma sessão usando transação do Prisma
   */
  async remove(sessionId: string, companyId: string): Promise<boolean> {
    try {
      const sessionData = this.sessions.get(sessionId);

      if (sessionData) {
        await sessionData.client.destroy();
        this.sessions.delete(sessionId);
      }

      // Verifica se a sessão existe antes de tentar remover
      const session = await this.prisma.messagingSession.findFirst({
        where: { id: sessionId, companyId },
      });

      if (!session) {
        this.logger.warn(`Sessão não encontrada: ${sessionId}`);
        return false;
      }

      // 🔥 NOVO: Usar transação do Prisma para exclusão atômica
      await this.prisma.$transaction(async (tx) => {
        // 1. Remove histórico de fluxo de contato
        await tx.contactFlowHistory.deleteMany({
          where: {
            contactFlowState: {
              messagingSessionId: sessionId,
              companyId: companyId,
            },
          },
        });

        // 2. Remove estados de fluxo de contato
        await tx.contactFlowState.deleteMany({
          where: {
            messagingSessionId: sessionId,
            companyId: companyId,
          },
        });

        // 3. Remove histórico de tickets
        await tx.ticketHistory.deleteMany({
          where: {
            ticket: {
              messagingSessionId: sessionId,
              companyId: companyId,
            },
          },
        });

        // 4. Remove mensagens
        await tx.message.deleteMany({
          where: {
            messagingSessionId: sessionId,
            companyId: companyId,
          },
        });

        // 5. Remove tickets
        await tx.ticket.deleteMany({
          where: {
            messagingSessionId: sessionId,
            companyId: companyId,
          },
        });

        // 6. Remove contatos ignorados
        await tx.ignoredContact.deleteMany({
          where: {
            messagingSessionId: sessionId,
            companyId: companyId,
          },
        });

        // 7. Remove contatos
        await tx.contact.deleteMany({
          where: {
            messagingSessionId: sessionId,
            companyId: companyId,
          },
        });

        // 8. Remove mídia relacionada (se existir)
        await tx.media.deleteMany({
          where: {
            companyId: companyId,
            metadata: {
              contains: sessionId, // Assumindo que sessionId está no metadata
            },
          },
        });

        // 9. Finalmente remove a sessão
        await tx.messagingSession.delete({
          where: { id: sessionId },
        });
      });

      // Remove arquivos da sessão (fora da transação)
      await this.removeSessionFiles(sessionId);

      this.qrCodes.delete(sessionId);
      this.logger.log(`Sessão removida com sucesso: ${sessionId}`);

      return true;
    } catch (error) {
      this.logger.error(`Erro ao remover sessão ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * 🗂️ Remove arquivos da sessão do sistema de arquivos
   */
  private async removeSessionFiles(sessionId: string): Promise<void> {
    try {
      const sessionDir = path.join(this.sessionsPath, sessionId);
      const sessionDirWithPrefix = path.join(
        this.sessionsPath,
        `session-${sessionId}`,
      );

      if (await fs.pathExists(sessionDir)) {
        await fs.remove(sessionDir);
        this.logger.debug(`Diretório da sessão removido: ${sessionDir}`);
      }

      if (await fs.pathExists(sessionDirWithPrefix)) {
        await fs.remove(sessionDirWithPrefix);
        this.logger.debug(
          `Diretório da sessão removido: ${sessionDirWithPrefix}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Erro ao remover arquivos da sessão ${sessionId}:`,
        error,
      );
    }
  }

  /**
   * 🔄 Reinicia APENAS o cliente WhatsApp sem apagar dados
   * Preserva conversas, contatos, tickets e mensagens
   */
  async restartSession(sessionId: string, companyId: string): Promise<any> {
    try {
      this.logger.log(
        `🔄 Reiniciando cliente da sessão ${sessionId} (SEM apagar dados)`,
      );

      // Busca dados da sessão no banco
      const dbSession = await this.prisma.messagingSession.findFirst({
        where: { id: sessionId, companyId },
      });

      if (!dbSession) {
        throw new Error('Sessão não encontrada');
      }

      // 1. Destruir cliente atual se existir (mas manter dados no banco)
      const existingSessionData = this.sessions.get(sessionId);
      if (existingSessionData) {
        try {
          await existingSessionData.client.destroy();
          this.logger.debug(
            `🗑️ Cliente WhatsApp destruído para sessão ${sessionId}`,
          );
        } catch (error) {
          this.logger.warn(
            `Erro ao destruir cliente da sessão ${sessionId}:`,
            error,
          );
        }
      }

      // 2. Limpar recursos de reconexão
      this.cleanupReconnectionResources(sessionId);

      // 3. Remover da memória (mas manter no banco)
      this.sessions.delete(sessionId);
      this.qrCodes.delete(sessionId);

      // 4. Aguardar um pouco para garantir limpeza completa
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 5. Recriar sessão na memória com os mesmos dados
      const session: Session = {
        id: sessionId,
        name: dbSession.name,
        status: 'connecting',
        createdAt: dbSession.createdAt,
        lastActiveAt: new Date(),
        sessionPath: path.join(this.sessionsPath, sessionId),
      };

      // 6. Criar novo cliente WhatsApp
      const client = this.createWhatsAppClient(sessionId);
      this.setupClientEventHandlers(client, session, companyId);

      // 7. Adicionar à memória
      this.sessions.set(sessionId, { client, session });

      // 8. Atualizar status no banco (sem apagar dados)
      await this.updateSessionInDatabase(sessionId, {
        status: 'CONNECTING',
        isActive: true,
        lastSeen: new Date(),
      });

      // 9. Inicializar cliente
      await client.initialize();

      this.logger.log(
        `✅ Cliente da sessão ${sessionId} reiniciado com sucesso (dados preservados)`,
      );

      return {
        id: sessionId,
        name: dbSession.name,
        status: 'connecting',
        message: 'Sessão reiniciada com sucesso. Dados preservados.',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao reiniciar sessão ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * ⚠️ MÉTODO PERIGOSO: Remove sessão E TODOS OS DADOS
   * Use apenas quando realmente quiser apagar tudo
   */
  async removeSessionAndAllData(
    sessionId: string,
    companyId: string,
  ): Promise<any> {
    try {
      // Busca dados da sessão no banco
      const dbSession = await this.prisma.messagingSession.findFirst({
        where: { id: sessionId, companyId },
      });

      if (!dbSession) {
        throw new Error('Sessão não encontrada');
      }

      // Remove a sessão atual E TODOS OS DADOS
      await this.remove(sessionId, companyId);

      // Aguarda um pouco antes de recriar
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Recria a sessão
      return await this.create(companyId, { name: dbSession.name });
    } catch (error) {
      this.logger.error(`Erro ao remover sessão e dados ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem (texto ou mídia) SEM salvar no banco (para evitar duplicação)
   * Use este método quando você vai salvar a mensagem em outro lugar
   */
  async sendMessageOnly(
    sessionId: string,
    to: string,
    message: string,
    mediaData?: {
      fileData: string; // Base64 do arquivo
      fileName: string; // Nome do arquivo
      mimeType: string; // Tipo MIME
    },
  ): Promise<Message> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData || sessionData.session.status !== 'connected') {
      throw new Error('Sessão não conectada');
    }

    try {
      let result: Message;

      if (mediaData) {
        // Enviar mídia
        const { MessageMedia } = await import('whatsapp-web.js');
        const media = new MessageMedia(
          mediaData.mimeType,
          mediaData.fileData,
          mediaData.fileName,
        );

        result = await sessionData.client.sendMessage(to, media, {
          caption: message || '',
        });

        this.logger.log(`Mídia enviada via ${sessionId} para ${to}`);
      } else {
        // Enviar texto normal
        result = await sessionData.client.sendMessage(to, message);
        this.logger.log(`Mensagem enviada via ${sessionId} para ${to}`);
      }

      // Registrar ID da mensagem para evitar duplicação no handleOutgoingMessage
      if (result.id?._serialized) {
        this.sentMessageIds.add(result.id._serialized);
        this.logger.debug(
          `📝 Mensagem registrada no cache: ${result.id._serialized}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem: ${error}`);
      throw error;
    }
  }

  /**
   * @deprecated Use sendMessageOnly() + salvar manualmente no banco com contexto adequado
   * Envia uma mensagem E salva no banco (método completo)
   *
   * ⚠️ ATENÇÃO: Este método pode causar duplicação se a mensagem também for
   * capturada pelo handleOutgoingMessage(). Prefira usar sendMessageOnly().
   */
  async sendMessage(
    sessionId: string,
    to: string,
    message: string,
    companyId?: string,
    isFromUser?: boolean, // 🔥 NOVO: Indica se a mensagem foi enviada por um usuário humano
  ): Promise<any> {
    // 🔥 NOVO: Log de aviso sobre uso do método deprecated
    this.logger.warn(
      `⚠️ Método sendMessage() está deprecated. Use sendMessageOnly() + salvar manualmente no banco. Chamado para ${to}`,
    );

    const sessionData = this.sessions.get(sessionId);

    if (!sessionData || sessionData.session.status !== 'connected') {
      throw new Error('Sessão não conectada');
    }

    try {
      const result = await sessionData.client.sendMessage(to, message);
      this.logger.log(`Mensagem enviada via ${sessionId} para ${to}`);

      // 🔥 NOVO: Registrar ID da mensagem para evitar duplicação
      if (result.id?._serialized) {
        this.sentMessageIds.add(result.id._serialized);
        this.logger.debug(
          `📝 Mensagem registrada no cache: ${result.id._serialized}`,
        );
      }

      // 🔥 NOVO: Salvar mensagem enviada no banco (se companyId fornecido)
      if (companyId) {
        try {
          // Buscar contato para salvar a mensagem (não tenta buscar nome, pois é outbound)
          const contact = await this.getOrCreateContact(
            to,
            companyId,
            sessionId,
            undefined, // Para mensagens enviadas, não conseguimos buscar o nome facilmente
          );

          // Buscar ticket ativo para este contato
          const activeTicket = await this.prisma.ticket.findFirst({
            where: {
              companyId,
              contactId: contact.id,
              status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] },
            },
          });

          await this.saveOutgoingMessage(
            to,
            message,
            sessionData.session,
            companyId,
            contact.id,
            activeTicket?.id,
            false, // Sempre false aqui pois é mensagem manual, não do bot
            'TEXT', // Tipo da mensagem
            isFromUser || false, // 🔥 NOVO: Passa informação se é de usuário humano
          );
        } catch (saveError) {
          this.logger.warn(
            `Erro ao salvar mensagem enviada manualmente: ${saveError}`,
          );
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem via ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém o QR Code como string
   */
  getQRCode(sessionId: string): string | null {
    return this.qrCodes.get(sessionId) || null;
  }

  /**
   * Obtém o QR Code como imagem base64
   */
  async getQRCodeAsBase64(sessionId: string): Promise<string | null> {
    const qrString = this.qrCodes.get(sessionId);

    if (!qrString) return null;

    try {
      return await QRCode.toDataURL(qrString);
    } catch (error) {
      this.logger.error(
        `Erro ao gerar QR Code base64 para ${sessionId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Obtém detalhes de uma sessão
   */
  async getSessionDetails(
    sessionId: string,
    companyId: string,
  ): Promise<{
    session: any;
    status: string;
    isConnected: boolean;
    lastSeen?: Date | null;
  }> {
    const dbSession = await this.prisma.messagingSession.findFirst({
      where: { id: sessionId, companyId },
    });

    if (!dbSession) {
      throw new Error('Sessão não encontrada');
    }

    const sessionData = this.sessions.get(sessionId);
    const isConnected = sessionData?.session.status === 'connected';

    return {
      session: {
        id: dbSession.id,
        name: dbSession.name,
        platform: dbSession.platform,
        createdAt: dbSession.createdAt,
        updatedAt: dbSession.updatedAt,
      },
      status: dbSession.status,
      isConnected,
      lastSeen: dbSession.lastSeen,
    };
  }

  /**
   * Busca uma sessão por empresa
   */
  async findOneByCompany(sessionId: string, companyId: string): Promise<any> {
    return await this.prisma.messagingSession.findFirst({
      where: { id: sessionId, companyId },
    });
  }

  /**
   * Busca todas as sessões de uma empresa
   */
  async findAllByCompany(companyId: string): Promise<any[]> {
    const dbSessions = await this.prisma.messagingSession.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return dbSessions.map((session) => {
      const sessionData = this.sessions.get(session.id);
      const isConnected = sessionData?.session.status === 'connected';

      return {
        ...session,
        isConnected,
        hasQrCode: this.qrCodes.has(session.id),
        currentStatus: sessionData?.session.status || 'disconnected',
      };
    });
  }

  /**
   * Limpa sessões inativas do banco de dados
   */
  async cleanupInactiveSessionsFromDatabase(companyId: string): Promise<{
    message: string;
    cleanedCount: number;
  }> {
    const inactiveSessions = await this.prisma.messagingSession.findMany({
      where: {
        companyId,
        isActive: false,
      },
    });

    for (const session of inactiveSessions) {
      const sessionDir = path.join(this.sessionsPath, session.id);
      const sessionDirWithPrefix = path.join(
        this.sessionsPath,
        `session-${session.id}`,
      );

      if (await fs.pathExists(sessionDir)) {
        await fs.remove(sessionDir);
      }

      if (await fs.pathExists(sessionDirWithPrefix)) {
        await fs.remove(sessionDirWithPrefix);
      }
    }

    const deleteResult = await this.prisma.messagingSession.deleteMany({
      where: {
        companyId,
        isActive: false,
      },
    });

    this.logger.log(
      `Limpeza concluída: ${deleteResult.count} sessões removidas`,
    );

    return {
      message: 'Limpeza de sessões inativas concluída',
      cleanedCount: deleteResult.count,
    };
  }

  /**
   * Sincroniza status das sessões
   */
  async syncSessionStatus(
    sessionId?: string,
    companyId?: string,
  ): Promise<void> {
    try {
      const whereClause: any = {};

      if (sessionId && companyId) {
        whereClause.id = sessionId;
        whereClause.companyId = companyId;
      } else if (companyId) {
        whereClause.companyId = companyId;
      }

      const dbSessions = await this.prisma.messagingSession.findMany({
        where: whereClause,
      });

      for (const dbSession of dbSessions) {
        const sessionData = this.sessions.get(dbSession.id);

        if (sessionData) {
          const currentStatus = this.mapSessionStatusToDatabase(
            sessionData.session.status,
          );

          if (currentStatus !== dbSession.status) {
            await this.updateSessionInDatabase(dbSession.id, {
              status: currentStatus,
              lastSeen: new Date(),
            });
          }
        } else if (dbSession.isActive) {
          // Sessão ativa no banco mas não em memória - marcar como inativa
          await this.markSessionAsInactive(dbSession.id);
        }
      }

      this.logger.log('Sincronização de status concluída');
    } catch (error) {
      this.logger.error('Erro na sincronização de status:', error);
    }
  }

  // ==================== MÉTODOS DE GERENCIAMENTO DE RECONEXÃO ====================

  /**
   * 🔄 Força reconexão manual de uma sessão
   */
  async forceReconnection(sessionId: string): Promise<boolean> {
    try {
      this.logger.log(`🔄 Forçando reconexão manual da sessão ${sessionId}`);

      // Limpar contadores de tentativas
      this.reconnectionAttempts.delete(sessionId);

      const timeout = this.reconnectionTimeouts.get(sessionId);
      if (timeout) {
        clearTimeout(timeout);
        this.reconnectionTimeouts.delete(sessionId);
      }

      // Iniciar reconexão
      await this.reconnectSession(sessionId);
      return true;
    } catch (error) {
      this.logger.error(
        `Erro ao forçar reconexão da sessão ${sessionId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * 🧹 Limpar recursos de reconexão para uma sessão
   */
  cleanupReconnectionResources(sessionId: string): void {
    this.reconnectionAttempts.delete(sessionId);

    const timeout = this.reconnectionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectionTimeouts.delete(sessionId);
    }

    this.logger.debug(
      `🧹 Recursos de reconexão limpos para sessão ${sessionId}`,
    );
  }

  /**
   * 📊 Obter status de reconexão das sessões
   */
  getReconnectionStatus(): {
    sessionId: string;
    attempts: number;
    maxAttempts: number;
    hasTimeout: boolean;
  }[] {
    const status: {
      sessionId: string;
      attempts: number;
      maxAttempts: number;
      hasTimeout: boolean;
    }[] = [];

    for (const [sessionId, attempts] of this.reconnectionAttempts) {
      status.push({
        sessionId,
        attempts,
        maxAttempts: this.maxReconnectionAttempts,
        hasTimeout: this.reconnectionTimeouts.has(sessionId),
      });
    }

    return status;
  }

  /**
   * 🔄 Resetar contadores de reconexão
   */
  resetReconnectionCounters(): void {
    const sessionIds = Array.from(this.reconnectionAttempts.keys());

    for (const sessionId of sessionIds) {
      this.cleanupReconnectionResources(sessionId);
    }

    this.logger.log(
      `🔄 Contadores de reconexão resetados para ${sessionIds.length} sessões`,
    );
  }

  /**
   * 🛑 Limpar recursos ao destruir o serviço
   */
  onModuleDestroy(): void {
    // 🔄 Com Cron, não precisamos mais limpar timers manuais
    // O NestJS cuida da limpeza dos cron jobs automaticamente

    // Limpar todos os timeouts de reconexão
    for (const timeout of this.reconnectionTimeouts.values()) {
      clearTimeout(timeout);
    }

    // Limpar mapas
    this.reconnectionAttempts.clear();
    this.reconnectionTimeouts.clear();
    this.sentMessageIds.clear();

    this.logger.log(
      '🛑 Recursos limpos na destruição do serviço (Cron jobs limpos automaticamente)',
    );
  }

  // ==================== HELPER METHODS ====================

  private async updateSessionInDatabase(
    sessionId: string,
    data: any,
  ): Promise<void> {
    try {
      await this.prisma.messagingSession.update({
        where: { id: sessionId },
        data,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar sessão ${sessionId} no banco:`,
        error,
      );
    }
  }

  private async markSessionAsInactive(
    sessionId: string,
    status = 'DISCONNECTED',
  ): Promise<void> {
    await this.updateSessionInDatabase(sessionId, {
      isActive: false,
      status,
    });
  }

  private mapSessionStatusToDatabase(status: string): string {
    const statusMap: Record<string, string> = {
      initializing: 'INITIALIZING',
      qr_ready: 'QR_READY',
      connecting: 'CONNECTING',
      authenticated: 'AUTHENTICATED',
      connected: 'CONNECTED',
      disconnected: 'DISCONNECTED',
      auth_failure: 'AUTH_FAILURE',
    };

    return statusMap[status] || 'UNKNOWN';
  }

  private async cleanup(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    this.qrCodes.delete(sessionId);

    const sessionDir = path.join(this.sessionsPath, sessionId);
    const sessionDirWithPrefix = path.join(
      this.sessionsPath,
      `session-${sessionId}`,
    );

    if (await fs.pathExists(sessionDir)) {
      await fs.remove(sessionDir);
    }

    if (await fs.pathExists(sessionDirWithPrefix)) {
      await fs.remove(sessionDirWithPrefix);
    }
  }

  // ==================== MESSAGE PERSISTENCE METHODS ====================

  /**
   * 💾 Salvar mensagem recebida no banco de dados
   */
  private async saveIncomingMessage(
    message: Message,
    session: Session,
    companyId: string,
    contactId: string,
    ticketId?: string,
    mediaData?: MediaData | null, // 🔥 ATUALIZADO: Dados da mídia base64
  ): Promise<void> {
    try {
      await this.prisma.message.create({
        data: {
          companyId,
          messagingSessionId: session.id,
          contactId,
          ticketId: ticketId || null,
          content: message.body || '',
          type: this.mapWhatsAppMessageType(message.type || 'unknown'),
          direction: 'INCOMING',
          mediaUrl: mediaData?.fileName || null, // Nome do arquivo como referência
          isRead: false,
          isFromBot: false,
          isMe: false, // Mensagens recebidas nunca são do próprio usuário
          metadata: JSON.stringify({
            whatsappId: message.id._serialized,
            timestamp: message.timestamp,
            author: message.author,
            hasMedia: message.hasMedia,
            originalType: message.type,
            // 🔥 NOVO: Dados da mídia salvos no metadata
            ...(mediaData && {
              media: {
                fileName: mediaData.fileName,
                mimeType: mediaData.mimeType,
                base64Data: mediaData.base64Data,
                size: mediaData.size,
              },
            }),
          }),
        },
      });

      this.logger.debug(
        `Mensagem recebida salva no banco: ${message.id._serialized}${mediaData ? ` (com mídia: ${mediaData.fileName})` : ''}`,
      );
    } catch (error) {
      this.logger.error('Erro ao salvar mensagem recebida:', error);
    }
  }

  /**
   * 💾 Salvar mensagem enviada no banco de dados
   */
  private async saveOutgoingMessage(
    to: string,
    content: string,
    session: Session,
    companyId: string,
    contactId: string,
    ticketId?: string,
    isFromBot = false,
    kind?: string,
    isFromUser = false, // 🔥 NOVO: Indica se foi enviada por usuário humano
    mediaData?: MediaData | null, // 🔥 NOVO: Dados da mídia base64
  ): Promise<void> {
    try {
      await this.prisma.message.create({
        data: {
          companyId,
          messagingSessionId: session.id,
          contactId,
          ticketId: ticketId || null,
          content,
          type: kind,
          direction: 'OUTGOING',
          mediaUrl: mediaData?.fileName || null, // Nome do arquivo como referência
          isRead: true, // Mensagens enviadas são consideradas "lidas"
          isFromBot,
          isMe: isFromUser, // NOVO: Marca mensagens enviadas por usuários como "minhas"
          metadata: JSON.stringify({
            to,
            sentAt: new Date().toISOString(),
            platform: 'WHATSAPP',
            isFromUser, // 🔥 NOVO: Adiciona informação sobre origem da mensagem
            source: isFromUser
              ? 'user_interface'
              : isFromBot
                ? 'bot'
                : 'manual',
            // 🔥 NOVO: Dados da mídia salvos no metadata
            ...(mediaData && {
              media: {
                fileName: mediaData.fileName,
                mimeType: mediaData.mimeType,
                base64Data: mediaData.base64Data,
                size: mediaData.size,
              },
            }),
          }),
        },
      });

      const origin = isFromUser ? 'usuário' : isFromBot ? 'bot' : 'manual';
      this.logger.debug(
        `Mensagem do ${origin} salva no banco para ${to}${mediaData ? ` (com mídia: ${mediaData.fileName})` : ''}`,
      );
    } catch (error) {
      this.logger.error('Erro ao salvar mensagem enviada:', error);
    }
  }

  /**
   * 🔄 Mapear tipos de mensagem do WhatsApp para o banco
   */
  private mapWhatsAppMessageType(whatsappType: string): string {
    const typeMap: Record<string, string> = {
      chat: 'TEXT',
      text: 'TEXT',
      image: 'IMAGE',
      audio: 'AUDIO',
      ptt: 'AUDIO', // Push-to-talk
      video: 'VIDEO',
      document: 'DOCUMENT',
      sticker: 'STICKER',
      location: 'LOCATION',
      contact: 'CONTACT',
      unknown: 'TEXT',
    };

    return typeMap[whatsappType] || 'TEXT';
  }

  /**
   * 📜 Buscar histórico de mensagens de uma conversa/ticket
   */
  async getConversationHistory(
    companyId: string,
    contactId?: string,
    ticketId?: string,
    sessionId?: string,
    limit = 50,
    offset = 0,
  ): Promise<{
    messages: any[];
    total: number;
    contact?: any;
    ticket?: any;
  }> {
    try {
      const whereClause: {
        companyId: string;
        contactId?: string;
        ticketId?: string;
        messagingSessionId?: string;
      } = { companyId };

      if (contactId) whereClause.contactId = contactId;
      if (ticketId) whereClause.ticketId = ticketId;
      if (sessionId) whereClause.messagingSessionId = sessionId;

      const [messages, total, contact, ticket] = await Promise.all([
        this.prisma.message.findMany({
          where: whereClause,
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip: offset,
          include: {
            contact: {
              select: { id: true, name: true, phoneNumber: true },
            },
          },
        }),
        this.prisma.message.count({ where: whereClause }),
        contactId
          ? this.prisma.contact.findUnique({
              where: { id: contactId },
              include: { messagingSession: true },
            })
          : null,
        ticketId
          ? this.prisma.ticket.findUnique({
              where: { id: ticketId },
              include: {
                contact: true,
                agents: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            })
          : null,
      ]);

      return {
        messages: messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type,
          direction: msg.direction,
          isFromBot: msg.isFromBot,
          isRead: msg.isRead,
          mediaUrl: msg.mediaUrl,
          createdAt: msg.createdAt,
          metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
          contact: msg.contact,
        })),
        total,
        contact,
        ticket,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar histórico de conversa:', error);
      return { messages: [], total: 0 };
    }
  }

  /**
   * 📊 Estatísticas de mensagens por período
   */
  async getMessageStats(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalMessages: number;
    incomingMessages: number;
    outgoingMessages: number;
    botMessages: number;
    humanMessages: number;
    messagesByType: Record<string, number>;
  }> {
    try {
      const whereClause = {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      const [
        totalMessages,
        incomingMessages,
        outgoingMessages,
        botMessages,
        humanMessages,
        messagesByType,
      ] = await Promise.all([
        this.prisma.message.count({ where: whereClause }),
        this.prisma.message.count({
          where: { ...whereClause, direction: 'INCOMING' },
        }),
        this.prisma.message.count({
          where: { ...whereClause, direction: 'OUTGOING' },
        }),
        this.prisma.message.count({
          where: { ...whereClause, isFromBot: true },
        }),
        this.prisma.message.count({
          where: { ...whereClause, isFromBot: false },
        }),
        this.prisma.message.groupBy({
          by: ['type'],
          where: whereClause,
          _count: true,
        }),
      ]);

      return {
        totalMessages,
        incomingMessages,
        outgoingMessages,
        botMessages,
        humanMessages,
        messagesByType: messagesByType.reduce(
          (acc, item) => {
            acc[item.type] = item._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      };
    } catch (error) {
      this.logger.error('Erro ao calcular estatísticas de mensagens:', error);
      return {
        totalMessages: 0,
        incomingMessages: 0,
        outgoingMessages: 0,
        botMessages: 0,
        humanMessages: 0,
        messagesByType: {},
      };
    }
  }

  // ==================== MEDIA SENDING METHODS ====================

  /**
   * 📷 Enviar mídia (imagem, vídeo, áudio, documento) via WhatsApp
   */
  private async sendMediaMessage(
    client: Client,
    to: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    caption?: string,
  ): Promise<void> {
    try {
      // Baixar mídia do blob storage
      const mediaBuffer = await this.mediaService.downloadMedia(mediaUrl);

      if (!mediaBuffer) {
        throw new Error(`Falha ao baixar mídia: ${mediaUrl}`);
      }

      // Determinar tipo MIME baseado no tipo de mídia e URL
      const mimeType = this.getMimeTypeByMediaType(mediaType, mediaUrl);
      const fileExtension = this.getFileExtension(mediaType, mediaUrl);

      // Criar objeto de mídia para WhatsApp
      const media = new (await import('whatsapp-web.js')).MessageMedia(
        mimeType,
        mediaBuffer.toString('base64'),
        `media.${fileExtension}`,
      );

      // Enviar mídia com caption opcional
      await client.sendMessage(to, media, { caption });

      this.logger.debug(`Mídia ${mediaType} enviada com sucesso para ${to}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar mídia ${mediaType}:`, error);
      throw error;
    }
  }

  /**
   * @deprecated Use sendMessageOnly() com parâmetro mediaData
   * Envia mídia (imagem, vídeo, áudio, documento) SEM salvar no banco (para evitar duplicação)
   * Use este método quando você vai salvar a mensagem em outro lugar
   */
  async sendMediaOnly(
    sessionId: string,
    to: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    caption?: string,
  ): Promise<any> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData || sessionData.session.status !== 'connected') {
      throw new Error('Sessão não conectada');
    }

    try {
      // Baixar mídia do blob storage
      const mediaBuffer = await this.mediaService.downloadMedia(mediaUrl);

      if (!mediaBuffer) {
        throw new Error(`Falha ao baixar mídia: ${mediaUrl}`);
      }

      // Determinar tipo MIME baseado no tipo de mídia e URL
      const mimeType = this.getMimeTypeByMediaType(mediaType, mediaUrl);
      const fileExtension = this.getFileExtension(mediaType, mediaUrl);

      // Criar objeto de mídia para WhatsApp
      const media = new (await import('whatsapp-web.js')).MessageMedia(
        mimeType,
        mediaBuffer.toString('base64'),
        `media.${fileExtension}`,
      );

      // Enviar mídia com caption opcional
      const result = await sessionData.client.sendMessage(to, media, {
        caption,
      });

      this.logger.log(`Mídia ${mediaType} enviada via ${sessionId} para ${to}`);

      // 🔥 REGISTRAR ID da mensagem para evitar duplicação no handleOutgoingMessage
      if (result.id?._serialized) {
        this.sentMessageIds.add(result.id._serialized);
        this.logger.debug(
          `📝 Mensagem de mídia registrada no cache: ${result.id._serialized}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Erro ao enviar mídia ${mediaType}:`, error);
      throw error;
    }
  }

  /**
   * Determina o tipo MIME baseado no tipo de mídia e URL
   */
  private getMimeTypeByMediaType(
    mediaType: 'image' | 'video' | 'audio' | 'document',
    mediaUrl: string,
  ): string {
    const urlLower = mediaUrl.toLowerCase();

    switch (mediaType) {
      case 'image':
        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg'))
          return 'image/jpeg';
        if (urlLower.includes('.png')) return 'image/png';
        if (urlLower.includes('.gif')) return 'image/gif';
        if (urlLower.includes('.webp')) return 'image/webp';
        return 'image/jpeg'; // default

      case 'video':
        if (urlLower.includes('.mp4')) return 'video/mp4';
        if (urlLower.includes('.webm')) return 'video/webm';
        if (urlLower.includes('.avi')) return 'video/avi';
        if (urlLower.includes('.mov')) return 'video/quicktime';
        return 'video/mp4'; // default

      case 'audio':
        if (urlLower.includes('.mp3')) return 'audio/mpeg';
        if (urlLower.includes('.wav')) return 'audio/wav';
        if (urlLower.includes('.ogg')) return 'audio/ogg';
        if (urlLower.includes('.m4a')) return 'audio/m4a';
        return 'audio/mpeg'; // default

      case 'document':
        if (urlLower.includes('.pdf')) return 'application/pdf';
        if (urlLower.includes('.doc')) return 'application/msword';
        if (urlLower.includes('.docx'))
          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (urlLower.includes('.txt')) return 'text/plain';
        return 'application/octet-stream'; // default

      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Determina a extensão do arquivo baseado no tipo de mídia e URL
   */
  private getFileExtension(
    mediaType: 'image' | 'video' | 'audio' | 'document',
    mediaUrl: string,
  ): string {
    const urlLower = mediaUrl.toLowerCase();

    // Tentar extrair extensão da URL
    const urlParts = urlLower.split('.');
    if (urlParts.length > 1) {
      const extension = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
      if (extension && extension.length <= 5) {
        return extension;
      }
    }

    // Fallback para extensões padrão por tipo
    switch (mediaType) {
      case 'image':
        return 'jpg';
      case 'video':
        return 'mp4';
      case 'audio':
        return 'mp3';
      case 'document':
        return 'pdf';
      default:
        return 'bin';
    }
  }

  /**
   * 🔥 NOVO: Processa mensagens enviadas pelo próprio usuário (fromMe = true)
   * Capturadas via client.on('message_create')
   */
  /**
   * 🔥 NOVO: Processa mensagens enviadas pelo usuário (fromMe = true)
   * Capturadas via client.on('message_create')
   */
  private async handleOutgoingMessage(
    message: Message,
    session: Session,
    companyId: string,
  ): Promise<void> {
    try {
      // 🔥 VERIFICAR SE JÁ PROCESSAMOS ESTA MENSAGEM (evitar duplicação)
      if (
        message.id?._serialized &&
        this.sentMessageIds.has(message.id._serialized)
      ) {
        this.logger.debug(
          `📝 Mensagem ${message.id._serialized} já processada - ignorando duplicata`,
        );
        return;
      }

      session.lastActiveAt = new Date();
      await this.updateSessionInDatabase(session.id, { lastSeen: new Date() });

      // Para mensagens enviadas (fromMe = true), precisamos obter o contato do DESTINATÁRIO
      // message.from é você mesmo, message.to é o destinatário
      const destinationPhoneNumber = message.to || message.from;

      // Buscar ou criar contato do destinatário (tentando obter o nome)
      let contactName: string | undefined;

      try {
        // Para mensagens enviadas, usar o client para buscar o contato do destinatário
        const sessionData = this.sessions.get(session.id);
        if (sessionData?.client) {
          const destinationContact = await sessionData.client.getContactById(
            destinationPhoneNumber,
          );
          contactName =
            destinationContact.pushname || destinationContact.name || undefined;
        }
      } catch {
        contactName = undefined;
      }

      const contact = await this.getOrCreateContact(
        destinationPhoneNumber,
        companyId,
        session.id,
        contactName,
      );

      // 🔥 PROCESSAR CONTEÚDO DA MENSAGEM (texto ou mídia)
      let messageContent = message.body || '';
      let mediaData: MediaData | null = null;

      // Se a mensagem tem mídia, processar o arquivo
      if (message.hasMedia) {
        try {
          const media = await message.downloadMedia();

          if (media) {
            // Preparar dados da mídia para salvar diretamente no banco
            mediaData = {
              fileName:
                media.filename || `sent_media_${message.id._serialized}`,
              mimeType: media.mimetype || 'application/octet-stream',
              base64Data: media.data, // Base64 data já vem pronto
              size: Buffer.from(media.data, 'base64').length,
            };

            // Para mensagens de mídia, usar o nome do arquivo como conteúdo se não há caption
            if (!messageContent && media.filename) {
              messageContent = `[${message.type?.toUpperCase()}] ${media.filename}`;
            }

            this.logger.debug(
              `📎 Mídia enviada processada - Tipo: ${message.type}, Arquivo: ${mediaData.fileName}, Tamanho: ${mediaData.size} bytes`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Erro ao processar mídia da mensagem enviada ${message.id._serialized}:`,
            error,
          );
          // Continuar processamento mesmo se falhar ao baixar mídia
          messageContent = `[${message.type?.toUpperCase()}] Arquivo enviado`;
        }
      }

      // Buscar ticket ativo para este contato
      const activeTicket = await this.prisma.ticket.findFirst({
        where: {
          companyId,
          contactId: contact.id,
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] },
        },
      });

      // Salvar mensagem enviada no banco (incluindo mídia)
      await this.saveOutgoingMessage(
        destinationPhoneNumber,
        messageContent, // Usar conteúdo processado
        session,
        companyId,
        contact.id,
        activeTicket?.id,
        false, // isFromBot = false (mensagem do usuário)
        message.type || 'text', // tipo da mensagem
        true, // isFromUser = true (mensagem enviada por usuário humano)
        mediaData, // 🔥 NOVO: Dados da mídia
      );

      // Adicionar mensagem à fila para o frontend
      await this.queueMessageForFrontend(
        message,
        session,
        companyId,
        activeTicket?.id,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem enviada da sessão ${session.name}:`,
        error,
      );
    }
  }
}
