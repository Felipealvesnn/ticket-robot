/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as qrcodeTerminal from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { PrismaService } from '../prisma/prisma.service';
import { MessageQueueService } from '../queue/message-queue.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Session } from './entities/session.entity';
import { DatabaseSession } from './dto/database-dtos';

// Interfaces para tipagem do banco

@Injectable()
export class SessionService implements OnModuleInit {
  private readonly logger = new Logger(SessionService.name);
  private sessions = new Map<string, { client: Client; session: Session }>();
  private readonly sessionsPath = path.join(process.cwd(), 'sessions');
  private readonly sessionConfigPath = path.join(
    this.sessionsPath,
    'sessions.json',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async onModuleInit() {
    await this.initializeSessionsDirectory();
    await this.loadExistingSessions();
  }

  private async initializeSessionsDirectory() {
    try {
      await fs.ensureDir(this.sessionsPath);
      this.logger.log(
        `Diretório de sessões criado/verificado: ${this.sessionsPath}`,
      );
    } catch (error) {
      this.logger.error('Erro ao criar diretório de sessões:', error);
    }
  }

  private async loadExistingSessions() {
    try {
      // Carregar sessões do banco de dados
      const dbSessions = await this.prisma.whatsappSession.findMany({
        where: {
          isActive: true,
        },
      });

      this.logger.log(
        `Encontradas ${dbSessions.length} sessões ativas no banco`,
      );

      for (const dbSession of dbSessions) {
        const sessionDir = path.join(this.sessionsPath, dbSession.id);
        if (await fs.pathExists(sessionDir)) {
          this.logger.log(
            `Restaurando sessão: ${dbSession.name} (${dbSession.id})`,
          );
          await this.restoreSessionFromDatabase(dbSession);
        } else {
          this.logger.warn(
            `Diretório da sessão ${dbSession.id} não encontrado, marcando como inativa`,
          );
          // Marcar como inativa no banco se o diretório não existir
          await this.prisma.whatsappSession.update({
            where: { id: dbSession.id },
            data: { isActive: false, status: 'DISCONNECTED' },
          });
        }
      }
    } catch (error) {
      this.logger.error('Erro ao carregar sessões existentes:', error);
    }
  }

  private async restoreSessionFromDatabase(dbSession: DatabaseSession) {
    try {
      const session: Session = {
        id: dbSession.id,
        name: dbSession.name,
        status: 'connecting',
        createdAt: dbSession.createdAt,
        lastActiveAt: dbSession.lastSeen || dbSession.updatedAt,
        sessionPath: path.join(this.sessionsPath, dbSession.id),
      };

      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: session.id,
          dataPath: this.sessionsPath,
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      });

      await this.setupClientEvents(client, session, dbSession.companyId);
      this.sessions.set(session.id, { client, session });
      await client.initialize();
    } catch (error) {
      this.logger.error(`Erro ao restaurar sessão ${dbSession.id}:`, error);
      // Marcar como inativa no banco em caso de erro
      await this.prisma.whatsappSession.update({
        where: { id: dbSession.id },
        data: { isActive: false, status: 'ERROR' },
      });
    }
  }

  async create(
    companyId: string,
    createSessionDto: CreateSessionDto,
  ): Promise<Session> {
    const sessionId = createSessionDto.name;

    if (this.sessions.has(sessionId)) {
      throw new Error(`Já existe uma sessão com o nome "${sessionId}"`);
    }

    // Verificar se já existe uma sessão com esse nome no banco para a empresa
    const existingSession = await this.prisma.whatsappSession.findFirst({
      where: {
        companyId,
        name: sessionId,
      },
    });

    if (existingSession) {
      throw new Error(
        `Já existe uma sessão com o nome "${sessionId}" para esta empresa`,
      );
    }

    const session: Session = {
      id: sessionId,
      name: sessionId,
      status: 'connecting',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      sessionPath: path.join(this.sessionsPath, sessionId),
    };

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: this.sessionsPath,
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    await this.setupClientEvents(client, session, companyId);
    this.sessions.set(sessionId, { client, session });

    try {
      // Salvar no banco de dados
      await this.prisma.whatsappSession.create({
        data: {
          id: sessionId,
          companyId,
          name: sessionId,
          status: 'CONNECTING',
          isActive: true,
        },
      });

      await client.initialize();
      this.logger.log(
        `Nova sessão criada: ${sessionId} para empresa ${companyId}`,
      );

      // 🎯 NOVO: Usar fila para criação de sessão
      await this.messageQueueService.queueMessage({
        sessionId: session.id,
        companyId,
        clientId: session.id,
        eventType: 'session-created',
        data: {
          session: session,
        },
        timestamp: new Date(),
        priority: 2,
      });

      return session;
    } catch (error) {
      this.logger.error(`Erro ao criar sessão ${sessionId}:`, error);
      this.sessions.delete(sessionId);
      session.status = 'error';

      // Remover do banco se foi criada
      await this.prisma.whatsappSession.deleteMany({
        where: {
          id: sessionId,
          companyId,
        },
      });

      // 🎯 NOVO: Usar fila para erro
      await this.messageQueueService.queueMessage({
        sessionId,
        companyId,
        clientId: sessionId,
        eventType: 'session-error',
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date(),
        priority: 2,
      });

      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async setupClientEvents(
    client: Client,
    session: Session,
    companyId?: string,
  ) {
    client.on('qr', async (qr) => {
      this.logger.log(`QR Code gerado para sessão ${session.name}`);
      session.qrCode = qr;
      session.status = 'connecting';

      qrcodeTerminal.generate(qr, { small: true });
      this.logger.log('Escaneie o QR code com seu WhatsApp');

      // 🎯 NOVO: Usar fila para QR Code
      await this.messageQueueService.queueMessage({
        sessionId: session.id,
        companyId: companyId || 'unknown',
        clientId: session.id,
        eventType: 'qr-code',
        data: { qrCode: qr },
        timestamp: new Date(),
        priority: 2, // QR Code tem prioridade muito alta
      });

      try {
        const qrCodeBase64 = await QRCode.toDataURL(qr);
        // Também enviar versão base64 pela fila
        await this.messageQueueService.queueMessage({
          sessionId: session.id,
          companyId: companyId || 'unknown',
          clientId: session.id,
          eventType: 'qr-code-image' as any,
          data: { qrCodeBase64 },
          timestamp: new Date(),
          priority: 2,
        });
      } catch (error) {
        this.logger.error('Erro ao gerar QR code base64:', error);
      }

      // Atualizar no banco
      if (companyId) {
        await this.updateSessionInDatabase(session.id, companyId, {
          qrCode: qr,
          status: 'CONNECTING',
        });
      }
    });

    client.on('ready', async () => {
      this.logger.log(`Sessão ${session.name} conectada com sucesso!`);
      session.status = 'connected';
      session.lastActiveAt = new Date();
      session.qrCode = undefined;

      try {
        const info = client.info;
        session.clientInfo = {
          number: info.wid.user,
          name: info.pushname || 'Sem nome',
          platform: info.platform || 'Desconhecido',
        };

        // 🎯 NOVO: Usar fila para status de sessão
        await this.messageQueueService.queueMessage({
          sessionId: session.id,
          companyId: companyId || 'unknown',
          clientId: session.id,
          eventType: 'session-status',
          data: {
            status: 'connected',
            clientInfo: session.clientInfo,
          },
          timestamp: new Date(),
          priority: 2, // Status tem prioridade alta
        });

        // Atualizar no banco
        if (companyId) {
          await this.updateSessionInDatabase(session.id, companyId, {
            status: 'CONNECTED',
            phoneNumber: info.wid.user,
            qrCode: null,
            lastSeen: new Date(),
          });
        }
      } catch (error) {
        this.logger.error('Erro ao obter informações do cliente:', error);
      }
    });

    client.on('authenticated', async () => {
      this.logger.log(`Sessão ${session.name} autenticada`);
      session.status = 'connected';
      session.lastActiveAt = new Date();

      // 🎯 NOVO: Usar fila para status de autenticação
      await this.messageQueueService.queueMessage({
        sessionId: session.id,
        companyId: companyId || 'unknown',
        clientId: session.id,
        eventType: 'session-status',
        data: {
          status: 'connected',
        },
        timestamp: new Date(),
        priority: 2,
      });

      // Atualizar no banco
      if (companyId) {
        await this.updateSessionInDatabase(session.id, companyId, {
          status: 'CONNECTED',
          lastSeen: new Date(),
        });
      }
    });

    client.on('auth_failure', async (msg) => {
      this.logger.error(
        `Falha na autenticação da sessão ${session.name}:`,
        msg,
      );
      session.status = 'error';

      // 🎯 NOVO: Usar fila para status de erro
      await this.messageQueueService.queueMessage({
        sessionId: session.id,
        companyId: companyId || 'unknown',
        clientId: session.id,
        eventType: 'session-status',
        data: {
          status: 'error',
        },
        timestamp: new Date(),
        priority: 2,
      });

      // 🎯 NOVO: Usar fila para mensagem de erro específica
      await this.messageQueueService.queueMessage({
        sessionId: session.id,
        companyId: companyId || 'unknown',
        clientId: session.id,
        eventType: 'session-error',
        data: {
          error: `Falha na autenticação: ${msg}`,
        },
        timestamp: new Date(),
        priority: 2,
      });

      // Atualizar no banco
      if (companyId) {
        await this.updateSessionInDatabase(session.id, companyId, {
          status: 'ERROR',
        });
      }
    });

    client.on('disconnected', async (reason) => {
      this.logger.warn(`Sessão ${session.name} desconectada:`, reason);
      session.status = 'disconnected';

      // 🎯 NOVO: Usar fila para status de desconexão
      await this.messageQueueService.queueMessage({
        sessionId: session.id,
        companyId: companyId || 'unknown',
        clientId: session.id,
        eventType: 'session-status',
        data: {
          status: 'disconnected',
        },
        timestamp: new Date(),
        priority: 2,
      });

      // Atualizar no banco
      if (companyId) {
        await this.updateSessionInDatabase(session.id, companyId, {
          status: 'DISCONNECTED',
        });
      }
    });

    client.on('message', async (message) => {
      session.lastActiveAt = new Date();

      // 🎯 NOVO: Usar fila para garantir entrega
      await this.messageQueueService.queueMessage({
        sessionId: session.id,
        companyId: companyId || 'unknown',
        clientId: session.id, // Pode ser melhorado para ID real do cliente
        eventType: 'new-message',
        data: {
          message: {
            id: (message as any).id?._serialized || (message as any).id || '',
            body: (message as any).body || '',
            from: (message as any).from || '',
            to: (message as any).to || '',
            timestamp: (message as any).timestamp || Date.now(),
            type: (message as any).type || 'unknown',
            isGroupMsg: (message as any).isGroupMsg || false,
            author: (message as any).author,
            hasMedia: (message as any).hasMedia || false,
          },
        },
        timestamp: new Date(),
        priority: 1, // Mensagens têm prioridade alta
      });

      this.logger.debug(
        `Mensagem adicionada à fila para sessão ${session.name}: ${(message as any).body}`,
      );
    });
  }

  findAll(): Session[] {
    return Array.from(this.sessions.values()).map((item) => item.session);
  }

  findOne(id: string): Session | null {
    const sessionData = this.sessions.get(id);
    return sessionData ? sessionData.session : null;
  }

  getQRCode(id: string): string | null {
    const sessionData = this.sessions.get(id);
    return sessionData?.session.qrCode || null;
  }

  async getQRCodeAsBase64(id: string): Promise<string | null> {
    const sessionData = this.sessions.get(id);
    const qrCodeString = sessionData?.session.qrCode;

    if (!qrCodeString) {
      return null;
    }

    try {
      const qrCodeBase64 = await QRCode.toDataURL(qrCodeString);
      return qrCodeBase64;
    } catch (error) {
      this.logger.error(
        `Erro ao gerar QR code base64 para sessão ${id}:`,
        error,
      );
      return null;
    }
  }

  async update(
    sessionId: string,
    companyId: string,
    updateSessionDto: UpdateSessionDto,
  ): Promise<Session> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    // Verificar se a sessão pertence à empresa
    const dbSession = await this.prisma.whatsappSession.findFirst({
      where: {
        id: sessionId,
        companyId,
        isActive: true,
      },
    });

    if (!dbSession) {
      throw new Error(`Sessão ${sessionId} não encontrada para esta empresa`);
    }

    // Atualizar na memória
    if (updateSessionDto.name) {
      sessionData.session.name = updateSessionDto.name;
    }

    // Atualizar no banco
    const updateData: any = {};
    if (updateSessionDto.name) {
      updateData.name = updateSessionDto.name;
    }

    await this.prisma.whatsappSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    this.logger.log(`Sessão ${sessionId} atualizada com sucesso`);
    return sessionData.session;
  }

  async remove(sessionId: string, companyId?: string): Promise<void> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    try {
      await sessionData.client.destroy();
      this.sessions.delete(sessionId);

      const sessionDir = path.join(this.sessionsPath, sessionId);
      if (await fs.pathExists(sessionDir)) {
        await fs.remove(sessionDir);
        this.logger.log(`Arquivos da sessão ${sessionId} removidos`);
      }

      // Remover do banco se companyId for fornecido
      if (companyId) {
        await this.prisma.whatsappSession.updateMany({
          where: {
            id: sessionId,
            companyId,
          },
          data: {
            isActive: false,
            status: 'DISCONNECTED',
          },
        });
      }

      // 🎯 NOVO: Usar fila para remoção de sessão
      await this.messageQueueService.queueMessage({
        sessionId,
        companyId: companyId || 'unknown',
        clientId: sessionId,
        eventType: 'session-removed',
        data: {},
        timestamp: new Date(),
        priority: 2,
      });

      this.logger.log(
        `Sessão ${sessionData.session.name} (${sessionId}) removida com sucesso`,
      );
    } catch (error) {
      this.logger.error(`Erro ao remover sessão ${sessionId}:`, error);
      throw error;
    }
  }

  async sendMessage(
    sessionId: string,
    number: string,
    message: string,
  ): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData || sessionData.session.status !== 'connected') {
      throw new Error(`Sessão ${sessionId} não está conectada`);
    }

    try {
      const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
      await sessionData.client.sendMessage(chatId, message);
      sessionData.session.lastActiveAt = new Date();
      return true;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem na sessão ${sessionId}:`,
        error,
      );
      throw error;
    }
  }

  getSessionStatus(id: string): string {
    const sessionData = this.sessions.get(id);
    return sessionData?.session.status || 'not_found';
  }

  // ================================
  // MÉTODOS AUXILIARES DO BANCO
  // ================================

  private async updateSessionInDatabase(
    sessionId: string,
    companyId: string,
    data: {
      status?: string;
      qrCode?: string | null;
      phoneNumber?: string;
      lastSeen?: Date;
    },
  ): Promise<void> {
    try {
      await this.prisma.whatsappSession.updateMany({
        where: {
          id: sessionId,
          companyId,
        },
        data,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar sessão ${sessionId} no banco:`,
        error,
      );
    }
  }

  async findAllByCompany(companyId: string): Promise<Session[]> {
    // Buscar sessões ativas do banco para a empresa
    const dbSessions = await this.prisma.whatsappSession.findMany({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Combinar com sessões em memória
    const memorySessions = Array.from(this.sessions.values()).map(
      (item) => item.session,
    );

    // Mapear sessões do banco para formato Session
    const mappedDbSessions: Session[] = dbSessions.map((dbSession) => {
      const memorySession = memorySessions.find((ms) => ms.id === dbSession.id);

      return {
        id: dbSession.id,
        name: dbSession.name,
        status:
          memorySession?.status ||
          this.mapDbStatusToMemoryStatus(dbSession.status),
        qrCode: memorySession?.qrCode,
        clientInfo: memorySession?.clientInfo,
        createdAt: dbSession.createdAt,
        lastActiveAt: dbSession.lastSeen || dbSession.updatedAt,
        sessionPath: path.join(this.sessionsPath, dbSession.id),
      };
    });

    return mappedDbSessions;
  }

  async findOneByCompany(
    sessionId: string,
    companyId: string,
  ): Promise<Session | null> {
    // Primeiro verificar na memória
    const memorySession = this.findOne(sessionId);
    if (memorySession) {
      return memorySession;
    }

    // Se não estiver na memória, buscar no banco
    const dbSession = await this.prisma.whatsappSession.findFirst({
      where: {
        id: sessionId,
        companyId,
        isActive: true,
      },
    });

    if (!dbSession) {
      return null;
    }

    // Mapear para formato Session
    return {
      id: dbSession.id,
      name: dbSession.name,
      status: this.mapDbStatusToMemoryStatus(dbSession.status),
      createdAt: dbSession.createdAt,
      lastActiveAt: dbSession.lastSeen || dbSession.updatedAt,
      sessionPath: path.join(this.sessionsPath, dbSession.id),
    };
  }

  private mapDbStatusToMemoryStatus(
    dbStatus: string,
  ): 'connecting' | 'connected' | 'disconnected' | 'error' {
    const statusMap: {
      [key: string]: 'connecting' | 'connected' | 'disconnected' | 'error';
    } = {
      CONNECTED: 'connected',
      DISCONNECTED: 'disconnected',
      CONNECTING: 'connecting',
      ERROR: 'error',
    };
    return statusMap[dbStatus] || 'disconnected';
  }

  // ================================
  // MÉTODOS ESPECÍFICOS PARA BANCO
  // ================================

  /**
   * Restart uma sessão específica da empresa
   */
  async restartSession(sessionId: string, companyId: string): Promise<Session> {
    // Verificar se a sessão existe para a empresa
    const dbSession = await this.prisma.whatsappSession.findFirst({
      where: {
        id: sessionId,
        companyId,
        isActive: true,
      },
    });

    if (!dbSession) {
      throw new Error(`Sessão ${sessionId} não encontrada para esta empresa`);
    }

    // Remover da memória se estiver ativa
    const sessionData = this.sessions.get(sessionId);
    if (sessionData) {
      try {
        await sessionData.client.destroy();
        this.sessions.delete(sessionId);
      } catch (error) {
        this.logger.warn(`Erro ao destruir sessão ${sessionId}:`, error);
      }
    }

    // Remover arquivos locais
    const sessionDir = path.join(this.sessionsPath, sessionId);
    try {
      if (await fs.pathExists(sessionDir)) {
        await fs.remove(sessionDir);
        this.logger.log(
          `Arquivos da sessão ${sessionId} removidos para restart`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Erro ao remover arquivos da sessão ${sessionId}:`,
        error,
      );
    }

    // Atualizar status no banco
    await this.prisma.whatsappSession.update({
      where: { id: sessionId },
      data: {
        status: 'CONNECTING',
        qrCode: null,
        phoneNumber: null,
        lastSeen: null,
      },
    });

    // Recriar a sessão
    const session: Session = {
      id: sessionId,
      name: dbSession.name,
      status: 'connecting',
      createdAt: dbSession.createdAt,
      lastActiveAt: new Date(),
      sessionPath: path.join(this.sessionsPath, sessionId),
    };

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: this.sessionsPath,
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    await this.setupClientEvents(client, session, companyId);
    this.sessions.set(sessionId, { client, session });

    try {
      await client.initialize();
      this.logger.log(`Sessão ${sessionId} reiniciada com sucesso`);
      return session;
    } catch (error) {
      this.logger.error(`Erro ao reiniciar sessão ${sessionId}:`, error);
      this.sessions.delete(sessionId);

      await this.prisma.whatsappSession.update({
        where: { id: sessionId },
        data: { status: 'ERROR' },
      });

      throw error;
    }
  }

  /**
   * Obter informações detalhadas de uma sessão incluindo dados do banco
   */
  async getSessionDetails(
    sessionId: string,
    companyId: string,
  ): Promise<{
    session: Session | null;
    dbInfo: DatabaseSession | null;
    isConnected: boolean;
  }> {
    const memorySession = this.findOne(sessionId);
    const dbSession = await this.prisma.whatsappSession.findFirst({
      where: {
        id: sessionId,
        companyId,
        isActive: true,
      },
    });

    return {
      session: memorySession,
      dbInfo: dbSession as DatabaseSession | null,
      isConnected: !!memorySession && memorySession.status === 'connected',
    };
  }

  /**
   * Limpar sessões inativas no banco e arquivos órfãos
   */
  async cleanupInactiveSessionsFromDatabase(companyId?: string): Promise<{
    removedFromMemory: number;
    deactivatedInDb: number;
    orphanedFilesRemoved: number;
  }> {
    const now = new Date();
    const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 horas
    let removedFromMemory = 0;
    let deactivatedInDb = 0;
    let orphanedFilesRemoved = 0;

    // Limpar da memória
    for (const [id, { session, client }] of this.sessions.entries()) {
      const timeSinceLastActive =
        now.getTime() - session.lastActiveAt.getTime();

      if (
        session.status === 'disconnected' &&
        timeSinceLastActive > inactiveThreshold
      ) {
        try {
          await client.destroy();
          this.sessions.delete(id);
          removedFromMemory++;

          const sessionDir = path.join(this.sessionsPath, id);
          if (await fs.pathExists(sessionDir)) {
            await fs.remove(sessionDir);
            orphanedFilesRemoved++;
          }
        } catch (error) {
          this.logger.error(`Erro ao limpar sessão ${id} da memória:`, error);
        }
      }
    }

    // Desativar no banco sessões antigas
    const whereClause: any = {
      isActive: true,
      status: 'DISCONNECTED',
      updatedAt: {
        lt: new Date(now.getTime() - inactiveThreshold),
      },
    };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    const inactiveSessions = await this.prisma.whatsappSession.findMany({
      where: whereClause,
    });

    for (const session of inactiveSessions) {
      await this.prisma.whatsappSession.update({
        where: { id: session.id },
        data: { isActive: false },
      });
      deactivatedInDb++;

      // Remover arquivos órfãos
      const sessionDir = path.join(this.sessionsPath, session.id);
      try {
        if (await fs.pathExists(sessionDir)) {
          await fs.remove(sessionDir);
          orphanedFilesRemoved++;
        }
      } catch (error) {
        this.logger.warn(
          `Erro ao remover arquivos da sessão ${session.id}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Limpeza concluída: ${removedFromMemory} da memória, ${deactivatedInDb} desativadas no banco, ${orphanedFilesRemoved} arquivos órfãos removidos`,
    );

    return {
      removedFromMemory,
      deactivatedInDb,
      orphanedFilesRemoved,
    };
  }

  /**
   * Sincronizar status entre memória e banco
   */
  async syncSessionStatus(
    sessionId?: string,
    companyId?: string,
  ): Promise<void> {
    if (sessionId) {
      // Sincronizar uma sessão específica
      const memorySession = this.sessions.get(sessionId);
      if (memorySession && companyId) {
        await this.updateSessionInDatabase(sessionId, companyId, {
          status: this.mapMemoryStatusToDbStatus(memorySession.session.status),
          lastSeen: memorySession.session.lastActiveAt,
        });
      }
    } else {
      // Sincronizar todas as sessões
      for (const [id, { session }] of this.sessions.entries()) {
        try {
          const dbSession = await this.prisma.whatsappSession.findUnique({
            where: { id },
          });

          if (dbSession) {
            await this.updateSessionInDatabase(id, dbSession.companyId, {
              status: this.mapMemoryStatusToDbStatus(session.status),
              lastSeen: session.lastActiveAt,
            });
          }
        } catch (error) {
          this.logger.warn(`Erro ao sincronizar sessão ${id}:`, error);
        }
      }
    }
  }

  private mapMemoryStatusToDbStatus(memoryStatus: string): string {
    const statusMap: { [key: string]: string } = {
      connecting: 'CONNECTING',
      connected: 'CONNECTED',
      disconnected: 'DISCONNECTED',
      error: 'ERROR',
    };
    return statusMap[memoryStatus] || 'DISCONNECTED';
  }
}
