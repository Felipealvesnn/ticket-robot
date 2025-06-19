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
import { UpdateSessionDto } from './dto/update-session.dto';

@ApiTags('Sessões WhatsApp')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova sessão WhatsApp' })
  @ApiResponse({
    status: 201,
    description:
      'Sessão criada com sucesso. QR Code será gerado para autenticação.',
  })
  async create(@Body() createSessionDto: CreateSessionDto) {
    try {
      const session = await this.sessionService.create(createSessionDto);
      return {
        message: 'Sessão criada com sucesso',
        session: session,
        instructions: {
          step1:
            'Acesse GET /session/' + session.id + '/qr para obter o QR Code',
          step2: 'Escaneie o QR Code com seu WhatsApp',
          step3: 'Verifique o status em GET /session/' + session.id + '/status',
        },
      };
    } catch (error) {
      return {
        message: 'Erro ao criar sessão',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
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

  @Get('active')
  @ApiOperation({ summary: 'Listar apenas sessões ativas (conectadas)' })
  @ApiResponse({ status: 200, description: 'Lista de sessões conectadas' })
  findActiveSessions() {
    const sessions = this.sessionService.findAll();
    const activeSessions = sessions.filter((s) => s.status === 'connected');
    return {
      total: activeSessions.length,
      sessions: activeSessions,
    };
  }

  @Get('connecting')
  findConnectingSessions() {
    const sessions = this.sessionService.findAll();
    const connectingSessions = sessions.filter(
      (s) => s.status === 'connecting',
    );
    return {
      total: connectingSessions.length,
      sessions: connectingSessions,
    };
  }

  @Get('stats')
  getStats() {
    const sessions = this.sessionService.findAll();
    const stats = {
      total: sessions.length,
      connected: sessions.filter((s) => s.status === 'connected').length,
      connecting: sessions.filter((s) => s.status === 'connecting').length,
      disconnected: sessions.filter((s) => s.status === 'disconnected').length,
      error: sessions.filter((s) => s.status === 'error').length,
    };
    return stats;
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
  @ApiOperation({ summary: 'Obter QR Code para autenticação' })
  @ApiParam({ name: 'id', description: 'Nome da sessão' })
  @ApiResponse({ status: 200, description: 'QR Code em formato string' })
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
  async getQRCodeImage(@Param('id') id: string) {
    const qrCodeBase64 = await this.sessionService.getQRCodeAsBase64(id);
    if (!qrCodeBase64) {
      return {
        message: 'QR Code não disponível. Sessão pode já estar conectada.',
      };
    }
    return { qrCodeImage: qrCodeBase64 };
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    const status = this.sessionService.getSessionStatus(id);
    return { status };
  }

  @Post(':id/message')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { number: string; message: string },
  ) {
    const success = await this.sessionService.sendMessage(
      id,
      body.number,
      body.message,
    );
    return { success };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return await this.sessionService.update(id, updateSessionDto);
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

  @Get(':id/info')
  getSessionInfo(@Param('id') id: string) {
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
