/* eslint-disable prettier/prettier */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as qrcodeTerminal from 'qrcode-terminal';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { ConversationService } from '../conversation/conversation.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessageQueueService } from '../queue/message-queue.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { DatabaseSession } from './dto/database-dtos';
import { Session } from './entities/session.entity';

/**
 * Gerenciador de sessões de mensagens multi-plataforma
 * Atualmente suporta WhatsApp via whatsapp-web.js
 */
@Injectable()
export class SessionService implements OnModuleInit {
  private readonly logger = new Logger(SessionService.name);
  private sessions = new Map<string, { client: Client; session: Session }>();
  private readonly sessionsPath = path.join(process.cwd(), 'sessions');
  private qrCodes = new Map<string, string>();
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageQueueService: MessageQueueService,
    private readonly conversationService: ConversationService,
  ) {}

  async onModuleInit() {
    await this.initializeSessionsDirectory();
    await this.loadExistingSessions();
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
      const dbSessions = await this.prisma.messagingSession.findMany({
        where: { isActive: true },
      });

      this.logger.log(`Carregando ${dbSessions.length} sessões ativas`);

      for (const dbSession of dbSessions) {
        const sessionDir = path.join(this.sessionsPath, dbSession.id);

        if (await fs.pathExists(sessionDir)) {
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
      await this.setupClientEventHandlers(client, session, dbSession.companyId);

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

    // 1. Ignorar mensagens próprias
    if (message.fromMe) {
      return true;
    }

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
        message.type === 'document'
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

      if (ignoreTypes.includes('media_video') && message.type === 'video') {
        this.logger.debug('Ignorando vídeo');
        return true;
      }
    }

    // 4. Filtrar mensagens vazias
    if (
      ignoreEmptyMessages &&
      (!message.body || message.body.trim().length === 0)
    ) {
      this.logger.debug('Ignorando mensagem vazia');
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

  private async setupClientEventHandlers(
    client: Client,
    session: Session,
    companyId: string,
  ): Promise<void> {
    client.on('qr', (qr) => this.handleQRCode(qr, session));
    client.on('ready', () => this.handleClientReady(session, companyId));
    client.on('authenticated', () =>
      this.handleAuthentication(session, companyId),
    );
    client.on('auth_failure', (msg) =>
      this.handleAuthFailure(msg, session, companyId),
    );
    client.on('disconnected', (reason) =>
      this.handleDisconnection(reason, session, companyId),
    );
    client.on('message', (message) => {
      // Aplicar filtro de mensagens antes de processar
      if (!this.shouldIgnoreMessage(message)) {
        this.handleIncomingMessage(message, session, companyId).catch(
          (error) => {
            this.logger.error(
              `Erro ao processar mensagem da sessão ${session.name}:`,
              error,
            );
          },
        );
      }
    });
  }

  private handleQRCode(qr: string, session: Session): void {
    this.qrCodes.set(session.id, qr);
    session.status = 'qr_ready';

    qrcodeTerminal.generate(qr, { small: true });
    this.logger.log(`QR Code gerado para sessão: ${session.name}`);
  }

  private async handleClientReady(
    session: Session,
    companyId: string,
  ): Promise<void> {
    session.status = 'connected';
    session.lastActiveAt = new Date();
    this.qrCodes.delete(session.id);

    this.logger.log(`Sessão conectada: ${session.name}`);

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

    await this.updateSessionInDatabase(session.id, {
      status: 'AUTHENTICATED',
      lastSeen: new Date(),
    });
  }

  private async handleAuthFailure(
    msg: string,
    session: Session,
    companyId: string,
  ): Promise<void> {
    session.status = 'auth_failure';
    this.logger.error(
      `Falha de autenticação na sessão ${session.name}: ${msg}`,
    );

    await this.updateSessionInDatabase(session.id, {
      status: 'AUTH_FAILURE',
      isActive: false,
    });
  }

  private async handleDisconnection(
    reason: string,
    session: Session,
    companyId: string,
  ): Promise<void> {
    session.status = 'disconnected';
    this.qrCodes.delete(session.id);

    this.logger.warn(`Sessão desconectada ${session.name}: ${reason}`);

    await this.updateSessionInDatabase(session.id, {
      status: 'DISCONNECTED',
      isActive: false,
    });
  }
  private async handleIncomingMessage(
    message: Message,
    session: Session,
    companyId: string,
  ): Promise<void> {
    try {
      session.lastActiveAt = new Date();
      await this.updateSessionInDatabase(session.id, { lastSeen: new Date() });

      // Buscar ou criar contato
      const contact = await this.getOrCreateContact(
        message.from,
        companyId,
        session.id,
      );

      // 🔥 NOVO: Processar mensagem através do sistema de tickets/conversas
      const result = await this.conversationService.processIncomingMessage(
        companyId,
        session.id,
        contact.id,
        message.body || '',
      );

      this.logger.debug(
        `Mensagem processada - Ticket: ${result.ticketId}, Fluxo: ${result.shouldStartFlow}`,
      );

      // 🔥 NOVO: Salvar mensagem recebida no banco
      await this.saveIncomingMessage(
        message,
        session,
        companyId,
        contact.id,
        result.ticketId,
      );

      // Se houve resposta do fluxo, enviar de volta
      if (result.flowResponse) {
        const client = this.sessions.get(session.id)?.client;
        if (client) {
          await client.sendMessage(message.from, result.flowResponse);
          this.logger.debug(
            `Resposta do fluxo enviada: ${result.flowResponse}`,
          );

          // 🔥 NOVO: Salvar mensagem enviada pelo bot no banco
          await this.saveOutgoingMessage(
            message.from,
            result.flowResponse,
            session,
            companyId,
            contact.id,
            result.ticketId,
            true, // isFromBot = true
          );
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
  } /**
   * 🔥 NOVO: Adiciona mensagem à fila para ser enviada ao frontend
   */
  private async queueMessageForFrontend(
    message: Message,
    session: Session,
    companyId: string,
    ticketId?: string,
  ): Promise<void> {
    try {
      // Buscar ou criar contato
      const contact = await this.getOrCreateContact(
        message.from,
        companyId,
        session.id,
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
      };

      // Adicionar à fila com prioridade alta (mensagens são importantes)
      await this.messageQueueService.queueMessage({
        sessionId: session.id,
        companyId,
        clientId: message.from,
        eventType: 'new-message',
        data: {
          message: whatsappMessage,
          session: session,
          ticketId: ticketId, // 🔥 NOVO: Incluir ticketId na mensagem
          contactId: contact.id,
        },
        timestamp: new Date(),
        priority: 1, // Alta prioridade
      });

      this.logger.debug(
        `Mensagem adicionada à fila: ${message.from} -> ${session.name}${ticketId ? ` (Ticket: ${ticketId})` : ''}`,
      );
    } catch (error) {
      this.logger.error('Erro ao adicionar mensagem à fila:', error);
    }
  }
  private async getOrCreateContact(
    phoneNumber: string,
    companyId: string,
    sessionId: string,
  ) {
    return await this.prisma.contact.upsert({
      where: {
        companyId_phoneNumber: {
          phoneNumber,
          companyId,
        },
      },
      update: {
        lastMessageAt: new Date(),
        messagingSessionId: sessionId,
      },
      create: {
        phoneNumber,
        companyId,
        messagingSessionId: sessionId,
        lastMessageAt: new Date(),
        name: phoneNumber,
      },
    });
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
      await this.setupClientEventHandlers(client, session, companyId);

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
   * Remove uma sessão
   */
  async remove(sessionId: string, companyId: string): Promise<boolean> {
    try {
      const sessionData = this.sessions.get(sessionId);

      if (sessionData) {
        await sessionData.client.destroy();
        this.sessions.delete(sessionId);
      }

      // Remove do banco
      await this.prisma.messagingSession.deleteMany({
        where: { id: sessionId, companyId },
      });

      // Remove arquivos da sessão
      const sessionDir = path.join(this.sessionsPath, sessionId);
      if (await fs.pathExists(sessionDir)) {
        await fs.remove(sessionDir);
      }

      this.qrCodes.delete(sessionId);
      this.logger.log(`Sessão removida: ${sessionId}`);

      return true;
    } catch (error) {
      this.logger.error(`Erro ao remover sessão ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Reinicia uma sessão
   */
  async restartSession(sessionId: string, companyId: string): Promise<any> {
    try {
      // Busca dados da sessão no banco
      const dbSession = await this.prisma.messagingSession.findFirst({
        where: { id: sessionId, companyId },
      });

      if (!dbSession) {
        throw new Error('Sessão não encontrada');
      }

      // Remove a sessão atual
      await this.remove(sessionId, companyId);

      // Aguarda um pouco antes de recriar
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Recria a sessão
      return await this.create(companyId, { name: dbSession.name });
    } catch (error) {
      this.logger.error(`Erro ao reiniciar sessão ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(
    sessionId: string,
    to: string,
    message: string,
    companyId?: string,
  ): Promise<any> {
    const sessionData = this.sessions.get(sessionId);

    if (!sessionData || sessionData.session.status !== 'connected') {
      throw new Error('Sessão não conectada');
    }

    try {
      const result = await sessionData.client.sendMessage(to, message);
      this.logger.log(`Mensagem enviada via ${sessionId} para ${to}`);

      // 🔥 NOVO: Salvar mensagem enviada no banco (se companyId fornecido)
      if (companyId) {
        try {
          // Buscar contato para salvar a mensagem
          const contact = await this.getOrCreateContact(
            to,
            companyId,
            sessionId,
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
            false, // Mensagem manual, não do bot
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
      if (await fs.pathExists(sessionDir)) {
        await fs.remove(sessionDir);
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
    if (await fs.pathExists(sessionDir)) {
      await fs.remove(sessionDir);
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
          mediaUrl: message.hasMedia ? `media_${message.id._serialized}` : null,
          isRead: false,
          isFromBot: false,
          metadata: JSON.stringify({
            whatsappId: message.id._serialized,
            timestamp: message.timestamp,
            author: message.author,
            hasMedia: message.hasMedia,
            originalType: message.type,
          }),
        },
      });

      this.logger.debug(
        `Mensagem recebida salva no banco: ${message.id._serialized}`,
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
  ): Promise<void> {
    try {
      await this.prisma.message.create({
        data: {
          companyId,
          messagingSessionId: session.id,
          contactId,
          ticketId: ticketId || null,
          content,
          type: 'TEXT',
          direction: 'OUTGOING',
          mediaUrl: null,
          isRead: true, // Mensagens enviadas são consideradas "lidas"
          isFromBot,
          metadata: JSON.stringify({
            to,
            sentAt: new Date().toISOString(),
            platform: 'WHATSAPP',
          }),
        },
      });

      this.logger.debug(
        `Mensagem ${isFromBot ? 'do bot' : 'enviada'} salva no banco para ${to}`,
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
              include: { contact: true, assignedAgent: true },
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
}
