/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// Interfaces para tipagem do banco
// ...existing interfaces...

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as qrcodeTerminal from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { FlowStateService } from '../flow/flow-state.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessageQueueService } from '../queue/message-queue.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { DatabaseSession } from './dto/database-dtos';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Session } from './entities/session.entity';

// 🔥 NOVO: Interface para controle de fluxo
interface ContactFlowManager {
  startFlow: (
    contactId: string,
    flowId: string,
    triggerMessage?: string,
  ) => Promise<boolean>;
  processMessage: (
    contactId: string,
    message: string,
  ) => Promise<{ response?: string; shouldTransfer?: boolean }>;
  getActiveFlow: (contactId: string) => Promise<any>;
  finishFlow: (contactId: string) => Promise<void>;
}

@Injectable()
export class SessionService implements OnModuleInit {
  private readonly logger = new Logger(SessionService.name);
  private sessions = new Map<string, { client: Client; session: Session }>();
  private readonly sessionsPath = path.join(process.cwd(), 'sessions');
  private readonly sessionConfigPath = path.join(
    this.sessionsPath,
    'sessions.json',
  );

  // 🔥 NOVO: Cache de managers de fluxo por empresa
  private flowManagers = new Map<string, ContactFlowManager>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageQueueService: MessageQueueService,
    private readonly flowStateService: FlowStateService, // 🔥 NOVO: Injeta FlowStateService
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

      try {
        // 🔥 NOVO: Processar fluxo de chatbot antes de enviar para fila
        const flowResponse = await this.processFlowMessage(
          session,
          companyId || 'unknown',
          message,
        );

        // Se houve resposta do fluxo, enviar e não processar mais
        if (flowResponse?.response) {
          await client.sendMessage(message.from, flowResponse.response);

          // Se deve transferir para atendente, marcar na fila
          if (flowResponse.shouldTransfer) {
            await this.messageQueueService.queueMessage({
              sessionId: session.id,
              companyId: companyId || 'unknown',
              clientId: message.from,
              eventType: 'transfer-to-agent',
              data: {
                message: {
                  id: message.id?._serialized || message.id || '',
                  body: message.body || '',
                  from: message.from || '',
                  to: message.to || '',
                  timestamp: message.timestamp || Date.now(),
                  type: message.type || 'unknown',
                  author: message.author,
                  hasMedia: message.hasMedia || false,
                },
              },
              timestamp: new Date(),
              priority: 2, // Transferências têm prioridade alta
            });
          }
          return; // Não processar mais, fluxo já respondeu
        }

        // 🎯 Mensagem normal: adicionar à fila para processamento humano
        await this.messageQueueService.queueMessage({
          sessionId: session.id,
          companyId: companyId || 'unknown',
          clientId: message.from,
          eventType: 'new-message',
          data: {
            message: {
              id: message.id?._serialized || message.id || '',
              body: message.body || '',
              from: message.from || '',
              to: message.to || '',
              timestamp: message.timestamp || Date.now(),
              type: message.type || 'unknown',
              author: message.author,
              hasMedia: message.hasMedia || false,
            },
          },
          timestamp: new Date(),
          priority: 1, // Mensagens normais têm prioridade baixa
        });

        this.logger.debug(
          `Mensagem processada para sessão ${session.name}: ${message.body}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao processar mensagem na sessão ${session.name}:`,
          error,
        );

        // Em caso de erro, ainda assim adicionar à fila
        await this.messageQueueService.queueMessage({
          sessionId: session.id,
          companyId: companyId || 'unknown',
          clientId: message.from,
          eventType: 'new-message',
          data: {
            message: {
              id: message.id?._serialized || message.id || '',
              body: message.body || '',
              from: message.from || '',
              to: message.to || '',
              timestamp: message.timestamp || Date.now(),
              type: message.type || 'unknown',
              author: message.author,
              hasMedia: message.hasMedia || false,
            },
          },
          timestamp: new Date(),
          priority: 1,
        });
      }
    });
  }

  /**
   * 🔥 NOVO: Processar mensagem através do sistema de fluxos
   */
  private async processFlowMessage(
    session: Session,
    companyId: string,
    message: any,
  ): Promise<{ response?: string; shouldTransfer?: boolean } | null> {
    try {
      const phoneNumber = message.from.replace('@c.us', '');
      const messageBody = message.body || '';

      // 1. Buscar ou criar contato
      let contact = await this.prisma.contact.findFirst({
        where: {
          companyId,
          whatsappSessionId: session.id,
          phoneNumber,
        },
      });

      if (!contact) {
        // Criar novo contato
        contact = await this.prisma.contact.create({
          data: {
            companyId,
            whatsappSessionId: session.id,
            phoneNumber,
            name: message.pushname || `Contato ${phoneNumber}`,
            lastMessage: messageBody,
            lastMessageAt: new Date(),
          },
        });
      } else {
        // Atualizar última mensagem
        await this.prisma.contact.update({
          where: { id: contact.id },
          data: {
            lastMessage: messageBody,
            lastMessageAt: new Date(),
          },
        });
      }

      // 2. Verificar se está em fluxo ativo
      const activeFlow = await this.flowStateService.getActiveFlowState(
        companyId,
        session.id,
        contact.id,
      );

      if (activeFlow && activeFlow.awaitingInput) {
        // Contato está em fluxo aguardando resposta
        const result = await this.flowStateService.processUserInput(
          companyId,
          session.id,
          contact.id,
          messageBody,
        );

        if (result.success && result.response) {
          return {
            response: result.response,
            shouldTransfer:
              result.response.includes('transferir') ||
              result.response.includes('atendente'),
          };
        }
      }

      // 3. Verificar se mensagem deve iniciar novo fluxo
      const flowId = await this.flowStateService.shouldStartFlow(
        companyId,
        messageBody,
      );

      if (flowId) {
        const result = await this.flowStateService.startFlow(
          companyId,
          session.id,
          contact.id,
          flowId,
          messageBody,
        );

        if (result.success && result.response) {
          return {
            response: result.response,
            shouldTransfer: false,
          };
        }
      }

      // 4. Nenhum fluxo aplicável, deixar para atendimento humano
      return null;
    } catch (error) {
      this.logger.error('Erro ao processar fluxo:', error);
      return null;
    }
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

  /**
   * 🔄 Atualizar sessão no banco de dados
   */
  private async updateSessionInDatabase(
    sessionId: string,
    companyId: string,
    updates: Partial<{
      status: string;
      qrCode: string | null;
      phoneNumber: string;
      lastSeen: Date;
    }>,
  ): Promise<void> {
    try {
      await this.prisma.whatsappSession.updateMany({
        where: {
          id: sessionId,
          companyId,
        },
        data: updates,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar sessão ${sessionId} no banco:`,
        error,
      );
    }
  }

  /**
   * 🔄 Atualizar sessão
   */
  async update(
    id: string,
    updateSessionDto: UpdateSessionDto,
  ): Promise<Session | null> {
    const sessionData = this.sessions.get(id);
    if (!sessionData) {
      return null;
    }

    const { session } = sessionData;

    // Atualizar propriedades da sessão
    if (updateSessionDto.name) {
      session.name = updateSessionDto.name;
    }

    return session;
  }

  /**
   * 🗑️ Remover sessão
   */
  async remove(id: string, companyId: string): Promise<boolean> {
    const sessionData = this.sessions.get(id);
    if (!sessionData) {
      return false;
    }

    try {
      const { client } = sessionData;

      // Destruir cliente WhatsApp
      await client.destroy();

      // Remover da memória
      this.sessions.delete(id);

      // Remover diretório da sessão
      const sessionPath = path.join(this.sessionsPath, id);
      if (await fs.pathExists(sessionPath)) {
        await fs.remove(sessionPath);
      }

      // Marcar como inativa no banco
      await this.prisma.whatsappSession.updateMany({
        where: {
          id,
          companyId,
        },
        data: {
          isActive: false,
          status: 'DISCONNECTED',
        },
      });

      // 🎯 NOVO: Usar fila para remoção de sessão
      await this.messageQueueService.queueMessage({
        sessionId: id,
        companyId,
        clientId: id,
        eventType: 'session-removed',
        data: {},
        timestamp: new Date(),
        priority: 2,
      });

      this.logger.log(`Sessão ${id} removida com sucesso`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao remover sessão ${id}:`, error);
      return false;
    }
  }

  /**
   * 📤 Enviar mensagem
   */
  async sendMessage(
    sessionId: string,
    to: string,
    message: string,
  ): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      this.logger.error(`Sessão ${sessionId} não encontrada`);
      return false;
    }

    const { client } = sessionData;

    try {
      await client.sendMessage(to, message);
      this.logger.debug(
        `Mensagem enviada via ${sessionId} para ${to}: ${message}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem via ${sessionId}:`, error);
      return false;
    }
  }
}
