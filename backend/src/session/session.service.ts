/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as qrcodeTerminal from 'qrcode-terminal';
import * as QRCode from 'qrcode';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Session } from './entities/session.entity';
import { SessionGateway } from '../util/session.gateway';

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
    @Inject(forwardRef(() => SessionGateway))
    private readonly sessionSocketIoGateway: SessionGateway,
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
      if (await fs.pathExists(this.sessionConfigPath)) {
        const savedSessions = await fs.readJson(this.sessionConfigPath);
        this.logger.log(`Encontradas ${savedSessions.length} sessões salvas`);

        for (const sessionData of savedSessions) {
          const sessionDir = path.join(this.sessionsPath, sessionData.id);
          if (await fs.pathExists(sessionDir)) {
            this.logger.log(
              `Restaurando sessão: ${sessionData.name || sessionData.id}`,
            );
            await this.restoreSession(sessionData);
          } else {
            this.logger.warn(
              `Diretório da sessão ${sessionData.id} não encontrado`,
            );
          }
        }
      } else {
        this.logger.log('Nenhuma sessão salva encontrada');
      }
    } catch (error) {
      this.logger.error('Erro ao carregar sessões existentes:', error);
    }
  }

  private async restoreSession(sessionData: any) {
    try {
      const session: Session = {
        ...sessionData,
        status: 'connecting',
        createdAt: new Date(sessionData.createdAt),
        lastActiveAt: new Date(sessionData.lastActiveAt),
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

      await this.setupClientEvents(client, session);
      this.sessions.set(session.id, { client, session });
      await client.initialize();
    } catch (error) {
      this.logger.error(`Erro ao restaurar sessão ${sessionData.id}:`, error);
    }
  }

  async create(createSessionDto: CreateSessionDto): Promise<Session> {
    const sessionId = createSessionDto.name;

    if (this.sessions.has(sessionId)) {
      throw new Error(`Já existe uma sessão com o nome "${sessionId}"`);
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

    await this.setupClientEvents(client, session);
    this.sessions.set(sessionId, { client, session });

    try {
      await client.initialize();
      await this.saveSessions();
      this.logger.log(`Nova sessão criada: ${sessionId}`);

      this.sessionSocketIoGateway.emitSessionCreated(session);

      return session;
    } catch (error) {
      this.logger.error(`Erro ao criar sessão ${sessionId}:`, error);
      this.sessions.delete(sessionId);
      session.status = 'error';

      this.sessionSocketIoGateway.emitError(sessionId, error.message);

      throw error;
    }
  }

  private async setupClientEvents(client: Client, session: Session) {
    client.on('qr', async (qr) => {
      this.logger.log(`QR Code gerado para sessão ${session.name}`);
      session.qrCode = qr;
      session.status = 'connecting';

      qrcodeTerminal.generate(qr, { small: true });
      this.logger.log('Escaneie o QR code com seu WhatsApp');

      this.sessionSocketIoGateway.emitQRCode(session.id, qr);

      try {
        const qrCodeBase64 = await QRCode.toDataURL(qr);
        this.sessionSocketIoGateway.emitQRCodeBase64(session.id, qrCodeBase64);
      } catch (error) {
        this.logger.error('Erro ao gerar QR code base64:', error);
      }
    });

    client.on('ready', () => {
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

        this.sessionSocketIoGateway.emitSessionStatusChange(
          session.id,
          'connected',
          session.clientInfo,
        );

        this.saveSessions();
      } catch (error) {
        this.logger.error('Erro ao obter informações do cliente:', error);
      }
    });

    client.on('authenticated', () => {
      this.logger.log(`Sessão ${session.name} autenticada`);
      session.status = 'connected';
      session.lastActiveAt = new Date();

      this.sessionSocketIoGateway.emitSessionStatusChange(
        session.id,
        'connected',
      );
    });

    client.on('auth_failure', (msg) => {
      this.logger.error(
        `Falha na autenticação da sessão ${session.name}:`,
        msg,
      );
      session.status = 'error';

      this.sessionSocketIoGateway.emitSessionStatusChange(session.id, 'error');
      this.sessionSocketIoGateway.emitError(
        session.id,
        `Falha na autenticação: ${msg}`,
      );
    });

    client.on('disconnected', (reason) => {
      this.logger.warn(`Sessão ${session.name} desconectada:`, reason);
      session.status = 'disconnected';

      this.sessionSocketIoGateway.emitSessionStatusChange(
        session.id,
        'disconnected',
      );
    });

    client.on('message', (message) => {
      session.lastActiveAt = new Date();

      this.sessionSocketIoGateway.emitNewMessage(session.id, message);

      this.logger.debug(
        `Mensagem recebida na sessão ${session.name}: ${message.body}`,
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
    id: string,
    updateSessionDto: UpdateSessionDto,
  ): Promise<Session> {
    const sessionData = this.sessions.get(id);
    if (!sessionData) {
      throw new Error(`Sessão ${id} não encontrada`);
    }

    if (updateSessionDto.name) {
      sessionData.session.name = updateSessionDto.name;
    }

    await this.saveSessions();
    return sessionData.session;
  }

  async remove(id: string): Promise<void> {
    const sessionData = this.sessions.get(id);
    if (!sessionData) {
      throw new Error(`Sessão ${id} não encontrada`);
    }

    try {
      await sessionData.client.destroy();
      this.sessions.delete(id);

      const sessionDir = path.join(this.sessionsPath, id);
      if (await fs.pathExists(sessionDir)) {
        await fs.remove(sessionDir);
        this.logger.log(`Arquivos da sessão ${id} removidos`);
      }

      await this.saveSessions();
      this.sessionSocketIoGateway.emitSessionRemoved(id);

      this.logger.log(
        `Sessão ${sessionData.session.name} (${id}) removida com sucesso`,
      );
    } catch (error) {
      this.logger.error(`Erro ao remover sessão ${id}:`, error);
      throw error;
    }
  }

  async cleanupInactiveSessions(): Promise<number> {
    const now = new Date();
    const inactiveThreshold = 24 * 60 * 60 * 1000;
    let removedCount = 0;

    for (const [id, { session, client }] of this.sessions.entries()) {
      const timeSinceLastActive =
        now.getTime() - session.lastActiveAt.getTime();

      if (
        session.status === 'disconnected' &&
        timeSinceLastActive > inactiveThreshold
      ) {
        this.logger.log(`Removendo sessão inativa: ${session.name} (${id})`);
        try {
          await client.destroy();
          this.sessions.delete(id);

          const sessionDir = path.join(this.sessionsPath, id);
          if (await fs.pathExists(sessionDir)) {
            await fs.remove(sessionDir);
          }

          removedCount++;
        } catch (error) {
          this.logger.error(`Erro ao remover sessão inativa ${id}:`, error);
        }
      }
    }

    if (removedCount > 0) {
      await this.saveSessions();
      this.logger.log(`${removedCount} sessões inativas removidas`);
    }

    return removedCount;
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

  private async saveSessions(): Promise<void> {
    try {
      const sessionsToSave = Array.from(this.sessions.values()).map(
        ({ session }) => ({
          id: session.id,
          name: session.name,
          status: session.status,
          clientInfo: session.clientInfo,
          createdAt: session.createdAt,
          lastActiveAt: session.lastActiveAt,
          sessionPath: session.sessionPath,
        }),
      );

      await fs.writeJson(this.sessionConfigPath, sessionsToSave, { spaces: 2 });
      this.logger.debug(
        `${sessionsToSave.length} sessões salvas em ${this.sessionConfigPath}`,
      );
    } catch (error) {
      this.logger.error('Erro ao salvar sessões:', error);
    }
  }
}
