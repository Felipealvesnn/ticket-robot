import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  constructor(private configService: ConfigService<AllConfigType>) {
    // Configurar CORS dinamicamente
    const frontendUrl = this.configService.get('frontend.url', { infer: true });
    this.logger.log(`Configurando CORS para: ${frontendUrl}`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    this.connectedClients.set(client.id, client);

    client.emit('connected', {
      message: 'Conectado ao servidor WhatsApp',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join-session')
  handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `session-${data.sessionId}`;
    void client.join(room);
    this.logger.log(`Cliente ${client.id} entrou na sala ${room}`);

    client.emit('joined-session', {
      sessionId: data.sessionId,
      message: `Conectado à sessão ${data.sessionId}`,
    });
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `session-${data.sessionId}`;
    void client.leave(room);
    this.logger.log(`Cliente ${client.id} saiu da sala ${room}`);
  }

  emitQRCode(sessionId: string, qrCode: string) {
    this.server.to(`session-${sessionId}`).emit('qr-code', {
      sessionId,
      qrCode,
      timestamp: new Date().toISOString(),
    });
  }

  emitQRCodeBase64(sessionId: string, qrCodeBase64: string) {
    this.server.to(`session-${sessionId}`).emit('qr-code-image', {
      sessionId,
      qrCodeBase64,
      timestamp: new Date().toISOString(),
    });
  }

  emitSessionStatusChange(
    sessionId: string,
    status: string,
    clientInfo?: ClientInfo,
  ) {
    this.server.to(`session-${sessionId}`).emit('session-status', {
      sessionId,
      status,
      clientInfo,
      timestamp: new Date().toISOString(),
    });

    this.server.emit('session-status-global', {
      sessionId,
      status,
      clientInfo,
      timestamp: new Date().toISOString(),
    });
  }

  emitNewMessage(sessionId: string, message: WhatsAppMessage) {
    this.server.to(`session-${sessionId}`).emit('new-message', {
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
      },
      timestamp: new Date().toISOString(),
    });
  }

  emitSessionCreated(session: Session) {
    this.server.emit('session-created', {
      session,
      timestamp: new Date().toISOString(),
    });
  }

  emitSessionRemoved(sessionId: string) {
    this.server.emit('session-removed', {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  emitError(sessionId: string, error: string) {
    this.server.to(`session-${sessionId}`).emit('session-error', {
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

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
