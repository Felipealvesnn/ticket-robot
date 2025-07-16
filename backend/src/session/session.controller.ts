import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { CreateSessionDto } from './dto/create-session.dto';
import { SwaggerEndpoint } from './session.decorators';
import { SessionService } from './session.service';

@ApiTags('Sessões WhatsApp')
@Controller('session')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}
  @Post()
  @SwaggerEndpoint.CreateSession()
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    try {
      const session = await this.sessionService.create(
        user.companyId,
        createSessionDto,
      );

      // Aguarda um pouco para o QR code ser gerado
      let attempts = 0;
      const maxAttempts = 30; // 15 segundos máximo

      while (attempts < maxAttempts) {
        const qrCodeString = this.sessionService.getQRCode(session.id);
        if (qrCodeString) {
          // Gera QR code em base64 para exibir no Swagger
          const qrCodeBase64 = await this.sessionService.getQRCodeAsBase64(
            session.id,
          );

          return {
            message: '✅ Sessão criada com sucesso! Escaneie o QR Code abaixo.',
            // 🔥 NOVO: Estrutura compatível com SessionResponse
            id: session.id,
            name: session.name,
            platform: 'WHATSAPP',
            qrCode: qrCodeBase64, // QR Code em base64 para frontend
            status: session.status,
            isActive: true,
            createdAt: session.createdAt.toISOString(),
            updatedAt: new Date().toISOString(),
            isConnected: false,
            hasQrCode: true,
            currentStatus: session.status,
            // Campos extras para compatibilidade com Swagger
            session: {
              id: session.id,
              name: session.name,
              status: session.status,
              createdAt: session.createdAt,
            },
            qrCodeString: qrCodeString,
            qrCodeImage: qrCodeBase64,
            instructions: {
              step1:
                '📱 O QR Code já está sendo exibido acima no Swagger! Escaneie diretamente da tela',
              step2:
                '📲 Abra WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo',
              step3:
                '🔄 Verifique o status em: GET /session/' +
                session.id +
                '/status',
              step4:
                '💬 Após conectar, envie mensagens via: POST /session/' +
                session.id +
                '/message',
            },
            tips: {
              viewQR:
                '🖼️ A imagem do QR Code está sendo exibida automaticamente no Swagger UI acima!',
              expire: 'QR Code expira em alguns minutos',
              reconnect: 'Se expirar, delete e recrie a sessão',
            },
          };
        }

        // Aguarda 500ms antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      // Se não conseguiu gerar QR code em 15 segundos
      return {
        message: '⏳ Sessão criada, mas QR Code ainda está sendo gerado...',
        session: {
          id: session.id,
          name: session.name,
          status: session.status,
          createdAt: session.createdAt,
        },
        instructions: {
          step1:
            'Aguarde alguns segundos e acesse: GET /session/' +
            session.id +
            '/qr',
          step2:
            'Ou obtenha a imagem em: GET /session/' + session.id + '/qr/image',
          step3:
            'Verifique o status em: GET /session/' + session.id + '/status',
        },
        note: 'O QR Code deve aparecer em alguns segundos. Tente os endpoints acima.',
      };
    } catch (error) {
      return {
        message: '❌ Erro ao criar sessão',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        suggestion:
          'Verifique se o nome da sessão é único e contém apenas letras, números, hífens e underscores.',
      };
    }
  }

  @Get()
  @SwaggerEndpoint.FindAll()
  async findAll(@CurrentUser() user: CurrentUserData) {
    const sessions = await this.sessionService.findAllByCompany(user.companyId);
    return {
      total: sessions.length,
      sessions: sessions,
    };
  }

  @Get('stats')
  @SwaggerEndpoint.GetStats()
  async getStats(@CurrentUser() user: CurrentUserData) {
    const sessions = await this.sessionService.findAllByCompany(user.companyId);

    // Contadores por status
    const connectedSessions = sessions.filter((s) => s.status === 'connected');
    const connectingSessions = sessions.filter(
      (s) => s.status === 'connecting',
    );
    const disconnectedSessions = sessions.filter(
      (s) => s.status === 'disconnected',
    );
    const errorSessions = sessions.filter((s) => s.status === 'error');

    // Lista detalhada de todas as sessões
    const sessionDetails = sessions.map((session) => ({
      id: session.id,
      name: session.name,
      status: session.status,
      clientInfo: session.clientInfo,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      hasQrCode: !!session.qrCode,
    }));

    return {
      summary: {
        total: sessions.length,
        connected: connectedSessions.length,
        connecting: connectingSessions.length,
        disconnected: disconnectedSessions.length,
        error: errorSessions.length,
      },
      sessions: sessionDetails,
      groupedSessions: {
        connected: connectedSessions.map((s) => ({
          id: s.id,
          name: s.name,
          clientInfo: s.clientInfo,
          lastActiveAt: s.lastActiveAt,
        })),
        connecting: connectingSessions.map((s) => ({
          id: s.id,
          name: s.name,
          hasQrCode: !!s.qrCode,
          createdAt: s.createdAt,
        })),
        disconnected: disconnectedSessions.map((s) => ({
          id: s.id,
          name: s.name,
          lastActiveAt: s.lastActiveAt,
          createdAt: s.createdAt,
        })),
        error: errorSessions.map((s) => ({
          id: s.id,
          name: s.name,
          createdAt: s.createdAt,
          lastActiveAt: s.lastActiveAt,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cleanup')
  @SwaggerEndpoint.CleanupInactive()
  async cleanupInactive(@CurrentUser() user: CurrentUserData) {
    const result =
      await this.sessionService.cleanupInactiveSessionsFromDatabase(
        user.companyId,
      );
    return {
      message: 'Limpeza de sessões concluída',
      details: result,
    };
  }

  @Post('sync')
  @SwaggerEndpoint.SyncSessions()
  async syncSessions(@CurrentUser() user: CurrentUserData) {
    await this.sessionService.syncSessionStatus(undefined, user.companyId);
    return {
      message: 'Sincronização de sessões concluída',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.sessionService.findOneByCompany(id, user.companyId);
  }

  @Get(':id/qr')
  @SwaggerEndpoint.GetQRCode()
  async getQRCode(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Verificar se a sessão pertence à empresa
    const session = await this.sessionService.findOneByCompany(
      id,
      user.companyId,
    );
    if (!session) {
      return {
        message: 'Sessão não encontrada ou não pertence à sua empresa.',
      };
    }

    const qrCode = this.sessionService.getQRCode(id);
    if (!qrCode) {
      return {
        message: 'QR Code não disponível. Sessão pode já estar conectada.',
      };
    }
    return { qrCode };
  }
  @Get(':id/qr/image')
  @SwaggerEndpoint.GetQRCodeImage()
  async getQRCodeImage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Verificar se a sessão pertence à empresa
    const session = await this.sessionService.findOneByCompany(
      id,
      user.companyId,
    );
    if (!session) {
      return {
        message: 'Sessão não encontrada ou não pertence à sua empresa.',
      };
    }

    const qrCodeBase64 = await this.sessionService.getQRCodeAsBase64(id);
    if (!qrCodeBase64) {
      return {
        message: 'QR Code não disponível. Sessão pode já estar conectada.',
      };
    }
    return { qrCodeImage: qrCodeBase64 };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    await this.sessionService.remove(id, user.companyId);
    return { message: 'Sessão removida com sucesso' };
  }

  @Delete(':id/remove-all-data')
  @SwaggerEndpoint.RemoveSessionAndAllData()
  async removeSessionAndAllData(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    try {
      const session = await this.sessionService.removeSessionAndAllData(
        id,
        user.companyId,
      );
      return {
        message: 'Sessão e todos os dados removidos com sucesso',
        session: {
          id: session.id,
          name: session.name,
          status: session.status,
          createdAt: session.createdAt,
        },
      };
    } catch (error) {
      return {
        message: 'Erro ao remover sessão e dados',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  @Post(':id/restart')
  @SwaggerEndpoint.RestartSession()
  async restartSession(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    try {
      const session = await this.sessionService.restartSession(
        id,
        user.companyId,
      );
      return {
        message: 'Cliente WhatsApp reiniciado com sucesso. Dados preservados.',
        session: {
          id: session.id,
          name: session.name,
          status: session.status,
          createdAt: session.createdAt,
        },
      };
    } catch (error) {
      return {
        message: 'Erro ao reiniciar cliente WhatsApp',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  @Get(':id/status')
  async getSessionStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const session = await this.sessionService.findOneByCompany(
      id,
      user.companyId,
    );
    if (!session) {
      return {
        message: 'Sessão não encontrada ou não pertence à sua empresa.',
      };
    }

    return {
      id: session.id,
      name: session.name,
      status: session.status,
      clientInfo: session.clientInfo,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      hasQrCode: !!session.qrCode,
    };
  }

  @Get(':id/details')
  @SwaggerEndpoint.GetSessionDetails()
  async getSessionDetails(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    try {
      const details = await this.sessionService.getSessionDetails(
        id,
        user.companyId,
      );

      return {
        id: details.session.id,
        name: details.session.name,
        platform: details.session.platform,
        status: details.status,
        isConnected: details.isConnected,
        lastSeen: details.lastSeen,
        createdAt: details.session.createdAt,
        updatedAt: details.session.updatedAt,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        message:
          error instanceof Error
            ? error.message
            : 'Sessão não encontrada ou não pertence à sua empresa.',
      };
    }
  }

  @Get('conversation/:sessionId')
  @SwaggerEndpoint.GetConversationHistory()
  async getConversationHistory(
    @CurrentUser() user: CurrentUserData,
    @Param('sessionId') sessionId: string,
    @Body()
    filters?: {
      contactId?: string;
      ticketId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return await this.sessionService.getConversationHistory(
      user.companyId,
      filters?.contactId,
      filters?.ticketId,
      sessionId,
      filters?.limit,
      filters?.offset,
    );
  }

  @Get('stats/messages')
  @SwaggerEndpoint.GetMessageStats()
  async getMessageStats(
    @CurrentUser() user: CurrentUserData,
    @Body()
    params: {
      startDate: string;
      endDate: string;
    },
  ) {
    return await this.sessionService.getMessageStats(
      user.companyId,
      new Date(params.startDate),
      new Date(params.endDate),
    );
  }

  // ==================== ENDPOINTS DE GERENCIAMENTO DE RECONEXÃO ====================

  @Post(':sessionId/force-reconnect')
  @SwaggerEndpoint.ForceReconnection()
  async forceReconnection(
    @CurrentUser() user: CurrentUserData,
    @Param('sessionId') sessionId: string,
  ) {
    const session = await this.sessionService.findOneByCompany(
      sessionId,
      user.companyId,
    );
    if (!session) {
      return { success: false, message: 'Sessão não encontrada' };
    }

    const success = await this.sessionService.forceReconnection(sessionId);

    return {
      success,
      message: success
        ? 'Reconexão iniciada com sucesso'
        : 'Falha ao iniciar reconexão',
      sessionId,
    };
  }

  @Get('reconnection-status')
  @SwaggerEndpoint.GetReconnectionStatus()
  getReconnectionStatus() {
    const sessions = this.sessionService.getReconnectionStatus();

    return {
      sessions,
      total: sessions.length,
    };
  }

  @Post('reset-reconnection-counters')
  @SwaggerEndpoint.ResetReconnectionCounters()
  resetReconnectionCounters() {
    this.sessionService.resetReconnectionCounters();

    return {
      success: true,
      message: 'Contadores de reconexão resetados',
    };
  }
}
