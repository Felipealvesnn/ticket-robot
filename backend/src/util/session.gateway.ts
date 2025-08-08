import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/interfaces/auth.interface';
import { AllConfigType } from '../config/config.interface';
import { Session } from '../session/entities/session.entity';
import {
  ClientInfo,
  WhatsAppMessage,
} from '../session/interfaces/whatsapp-message.interface';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true, // Será configurado dinamicamente no constructor
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SessionGateway.name);
  private connectedClients = new Map<string, Socket>();
  private authenticatedClients = new Map<
    string,
    { userId: string; companyId: string }
  >();

  constructor(
    private configService: ConfigService<AllConfigType>,
    private jwtService: JwtService,
  ) {
    // Configurar CORS dinamicamente
    const frontendUrl = this.configService.get('frontend.url', { infer: true });
    this.logger.log(`Configurando CORS para: ${frontendUrl}`);
  }

  async handleConnection(client: Socket) {
    try {
      // Extrair token do handshake
      const token = client.handshake.auth?.token as string;

      if (!token) {
        this.logger.warn(`Cliente ${client.id} conectou sem token`);
        client.emit('error', { message: 'Token de autenticação necessário' });
        client.disconnect();
        return;
      }

      // Validar token JWT
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const { sub, companyId } = payload;

      if (!sub || !companyId) {
        this.logger.warn(`Cliente ${client.id} com token inválido`);
        client.emit('error', { message: 'Token de autenticação inválido' });
        client.disconnect();
        return;
      }

      // Armazenar informações do cliente autenticado
      this.connectedClients.set(client.id, client);
      this.authenticatedClients.set(client.id, { userId: sub, companyId });

      // Adicionar cliente à sala global da empresa
      void client.join(`company-${companyId}`);

      this.logger.log(
        `Cliente autenticado: ${client.id} (User: ${sub}, Company: ${companyId}) - adicionado à sala company-${companyId}`,
      );

      client.emit('connected', {
        message: 'Conectado ao servidor WhatsApp',
        clientId: client.id,
        sub,
        companyId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Erro na autenticação do cliente ${client.id}:`, error);
      client.emit('error', { message: 'Falha na autenticação' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.authenticatedClients.delete(client.id);
  }

  @SubscribeMessage('join-session')
  handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Verificar se o cliente está autenticado
      const authInfo = this.authenticatedClients.get(client.id);
      if (!authInfo) {
        this.logger.warn(
          `Cliente ${client.id} não autenticado tentando entrar na sessão ${data.sessionId}`,
        );
        client.emit('error', { message: 'Cliente não autenticado' });
        return;
      }

      const { companyId } = authInfo;

      // Criar sala específica da empresa-sessão
      const room = `company-${companyId}-session-${data.sessionId}`;
      void client.join(room);

      this.logger.log(`✅ Cliente entrou na sala ${companyId}`);

      // Verificar quantos clientes estão na sala
      const roomSize = this.server.sockets.adapter.rooms.get(room)?.size || 0;
      this.logger.debug(`📊 Sala ${room} agora tem ${roomSize} cliente(s)`);

      client.emit('joined-session', {
        sessionId: data.sessionId,
        message: `Conectado à sessão ${data.sessionId}`,
        room,
        clientsInRoom: roomSize,
      });
    } catch (error) {
      this.logger.error('Erro no handleJoinSession:', error);
      client.emit('error', { message: 'Erro ao entrar na sessão' });
    }
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Verificar se o cliente está autenticado
    const authInfo = this.authenticatedClients.get(client.id);
    if (!authInfo) {
      client.emit('error', { message: 'Cliente não autenticado' });
      return;
    }

    const { companyId } = authInfo;
    const room = `company-${companyId}-session-${data.sessionId}`;
    void client.leave(room);
    this.logger.log(`Cliente ${client.id} saiu da sala ${room}`);
  }

  emitQRCode(sessionId: string, qrCode: string, companyId?: string) {
    if (companyId) {
      // Emitir apenas para a empresa específica
      const room = `company-${companyId}-session-${sessionId}`;
      this.logger.debug(`📡 Emitindo QR Code para sala: ${room}`);
      this.server.to(room).emit('qr-code', {
        sessionId,
        qrCode,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`✅ QR Code emitido para sala ${room}`);
    } else {
      // Fallback para compatibilidade (remover após migração completa)
      this.server.to(`session-${sessionId}`).emit('qr-code', {
        sessionId,
        qrCode,
        timestamp: new Date().toISOString(),
      });
    }
  }

  emitQRCodeBase64(
    sessionId: string,
    qrCodeBase64: string,
    companyId?: string,
  ) {
    if (companyId) {
      const room = `company-${companyId}-session-${sessionId}`;
      this.logger.debug(`🖼️ Emitindo QR Code base64 para sala: ${room}`);
      this.server.to(room).emit('qr-code-image', {
        sessionId,
        qrCodeBase64,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`✅ QR Code base64 emitido para sala ${room}`);
    } else {
      // Fallback para compatibilidade
      this.server.to(`session-${sessionId}`).emit('qr-code-image', {
        sessionId,
        qrCodeBase64,
        timestamp: new Date().toISOString(),
      });
    }
  }

  emitSessionStatusChange(
    sessionId: string,
    status: string,
    companyId: string,
    clientInfo?: ClientInfo,
  ) {
    // Emitir para a sala específica da empresa
    this.server
      .to(`company-${companyId}-session-${sessionId}`)
      .emit('session-status', {
        sessionId,
        status,
        clientInfo,
        timestamp: new Date().toISOString(),
      });

    // Emitir para todos os clientes da empresa (sessões globais)
    this.server.to(`company-${companyId}`).emit('session-status-global', {
      sessionId,
      status,
      clientInfo,
      timestamp: new Date().toISOString(),
    });
  }

  emitNewMessage(
    sessionId: string,
    message: WhatsAppMessage,
    companyId: string,
    ticketId?: string,
    contactId?: string,
  ) {
    const messageData = {
      sessionId,
      message: {
        id: message.id?._serialized || '',
        body: message.body || '',
        from: message.from || '',
        to: message.to || '',
        timestamp: message.timestamp || Date.now(),
        type: message.type || 'unknown',
        isGroupMsg: message.isGroupMsg || false,
        author: message.author,
        isMedia: message.hasMedia || false,
        // 🔥 NOVO: Campo explícito para identificar mensagens próprias
        isMe: message.isMe || false,
      },
      ticketId: ticketId || null, // 🔥 Garantir que ticketId sempre esteja presente
      contactId: contactId || null, // 🔥 Incluir contactId para fallback
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(
      `📡 Emitindo mensagem com ticketId: ${ticketId}, contactId: ${contactId}, sessionId: ${sessionId}`,
    );

    this.server
      .to(`company-${companyId}-session-${sessionId}`)
      .emit('new-message', messageData);
  }

  emitSessionCreated(session: Session, companyId: string) {
    // Emitir apenas para clientes da empresa específica
    this.server.to(`company-${companyId}`).emit('session-created', {
      session,
      timestamp: new Date().toISOString(),
    });
  }

  emitSessionRemoved(sessionId: string, companyId: string) {
    // Emitir apenas para clientes da empresa específica
    this.server.to(`company-${companyId}`).emit('session-removed', {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  emitError(sessionId: string, error: string, companyId: string) {
    this.server
      .to(`company-${companyId}-session-${sessionId}`)
      .emit('session-error', {
        sessionId,
        error,
        timestamp: new Date().toISOString(),
      });
  }

  broadcast(event: string, data: Record<string, unknown>) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitNewTicket(
    sessionId: string,
    ticket: any,
    action: string,
    companyId: string,
  ) {
    const ticketData = {
      sessionId,
      ticket,
      action,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(
      `📡 Emitindo novo ticket: ${ticket.id}, action: ${action}, sessionId: ${sessionId}`,
    );

    this.server
      .to(`company-${companyId}-session-${sessionId}`)
      .emit('new-ticket', ticketData);
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
