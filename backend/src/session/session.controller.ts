import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('Sessões WhatsApp')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}
  @Post()
  @ApiOperation({
    summary: '🚀 Criar nova sessão WhatsApp',
    description:
      'Cria uma nova sessão e retorna o QR Code em base64 pronto para uso. O QR Code será exibido diretamente no Swagger UI! Espaços serão automaticamente convertidos em hífens.',
  })
  @ApiResponse({
    status: 400,
    description: '❌ Erro de validação ou sessão já existe',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Nome deve conter apenas letras, números, hífens e underscores',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async create(@Body() createSessionDto: CreateSessionDto) {
    try {
      const session = await this.sessionService.create(createSessionDto);

      // Aguarda um pouco para o QR code ser gerado
      let attempts = 0;
      const maxAttempts = 30; // 15 segundos máximo

      while (attempts < maxAttempts) {
        const qrCode = this.sessionService.getQRCode(session.id);
        if (qrCode) {
          // Gera QR code em base64 para exibir no Swagger
          const qrCodeBase64 = await this.sessionService.getQRCodeAsBase64(
            session.id,
          );

          return {
            message: '✅ Sessão criada com sucesso! Escaneie o QR Code abaixo.',
            session: {
              id: session.id,
              name: session.name,
              status: session.status,
              createdAt: session.createdAt,
            },
            qrCode: qrCode,
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
  @ApiOperation({ summary: 'Listar todas as sessões' })
  @ApiResponse({ status: 200, description: 'Lista de todas as sessões' })
  findAll() {
    const sessions = this.sessionService.findAll();
    return {
      total: sessions.length,
      sessions: sessions,
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: '📊 Estatísticas detalhadas das sessões',
    description:
      'Retorna estatísticas completas com contadores e lista detalhada de todas as sessões',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas detalhadas das sessões',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            connected: { type: 'number' },
            connecting: { type: 'number' },
            disconnected: { type: 'number' },
            error: { type: 'number' },
          },
        },
        sessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string' },
              hasQrCode: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              lastActiveAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  getStats() {
    const sessions = this.sessionService.findAll();

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
  async cleanupInactive() {
    const removedCount = await this.sessionService.cleanupInactiveSessions();
    return { message: `${removedCount} sessões inativas removidas` };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionService.findOne(id);
  }

  @Get(':id/qr')
  @ApiOperation({
    summary: '📱 Obter QR Code (texto)',
    description:
      'Retorna o QR Code em formato string para a sessão especificada',
  })
  @ApiParam({ name: 'id', description: 'ID/nome da sessão' })
  @ApiResponse({
    status: 200,
    description: 'QR Code em formato string',
    schema: {
      type: 'object',
      properties: {
        qrCode: { type: 'string', example: '2@B8n3XKz9L...' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'QR Code não disponível - sessão pode já estar conectada',
  })
  getQRCode(@Param('id') id: string) {
    const qrCode = this.sessionService.getQRCode(id);
    if (!qrCode) {
      return {
        message: 'QR Code não disponível. Sessão pode já estar conectada.',
      };
    }
    return { qrCode };
  }
  @Get(':id/qr/image')
  @ApiOperation({
    summary: '🖼️ Obter QR Code (imagem base64)',
    description:
      'Retorna o QR Code como imagem em base64. A imagem será exibida diretamente no Swagger UI!',
  })
  @ApiParam({ name: 'id', description: 'ID/nome da sessão' })
  @ApiResponse({
    status: 200,
    description: 'QR Code como imagem base64 - exibida no Swagger',
    schema: {
      type: 'object',
      properties: {
        qrCodeImage: {
          type: 'string',
          format: 'byte',
          description:
            '🖼️ Imagem QR Code em base64 - será exibida automaticamente!',
          example:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'QR Code não disponível - sessão pode já estar conectada',
  })
  async getQRCodeImage(@Param('id') id: string) {
    const qrCodeBase64 = await this.sessionService.getQRCodeAsBase64(id);
    if (!qrCodeBase64) {
      return {
        message: 'QR Code não disponível. Sessão pode já estar conectada.',
      };
    }
    return { qrCodeImage: qrCodeBase64 };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.sessionService.remove(id);
    return { message: 'Sessão removida com sucesso' };
  }

  @Post(':id/restart')
  async restartSession(@Param('id') id: string) {
    try {
      // Remove a sessão atual
      await this.sessionService.remove(id);
      // Cria uma nova sessão com o mesmo nome
      const newSession = await this.sessionService.create({ name: id });
      return {
        message: 'Sessão reiniciada com sucesso',
        session: newSession,
      };
    } catch (error) {
      return {
        message: 'Erro ao reiniciar sessão',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  @Get(':id/status')
  getSessionStatus(@Param('id') id: string) {
    const session = this.sessionService.findOne(id);
    if (!session) {
      return { message: 'Sessão não encontrada' };
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
}
