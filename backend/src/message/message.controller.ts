import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { SessionService } from '../session/session.service';
import { SendBulkMessageDto } from './dto/send-bulk-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageSwaggerEndpoint } from './message.decorators';

@ApiTags('Mensagens WhatsApp')
@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly sessionService: SessionService) {}

  @Post(':sessionId/send')
  @MessageSwaggerEndpoint.SendMessage()
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Buscar sessão da empresa do usuário
    const session = await this.sessionService.findOneByCompany(
      sessionId,
      user.companyId,
    );

    if (!session) {
      return {
        success: false,
        error: 'Sessão não encontrada ou não pertence à sua empresa',
        sessionId,
      };
    }

    // Verificar se está conectada
    if (session.status !== 'connected') {
      return {
        success: false,
        error: `Sessão não conectada (status: ${session.status})`,
        sessionId,
        currentStatus: session.status,
      };
    }

    try {
      // 🔥 NOVO: Usar sendMessageOnly para evitar duplicação
      await this.sessionService.sendMessageOnly(
        sessionId,
        sendMessageDto.number,
        sendMessageDto.message,
      );

      return {
        success: true,
        sessionId,
        recipient: sendMessageDto.number,
        message: sendMessageDto.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro ao enviar mensagem',
        sessionId,
        recipient: sendMessageDto.number,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post(':sessionId/send-bulk')
  @MessageSwaggerEndpoint.SendBulkMessage()
  async sendBulkMessage(
    @Param('sessionId') sessionId: string,
    @Body() sendBulkMessageDto: SendBulkMessageDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Buscar sessão da empresa do usuário
    const session = await this.sessionService.findOneByCompany(
      sessionId,
      user.companyId,
    );

    if (!session) {
      return {
        success: false,
        error: 'Sessão não encontrada ou não pertence à sua empresa',
        sessionId,
      };
    }

    if (session.status !== 'connected') {
      return {
        success: false,
        error: `Sessão não conectada (status: ${session.status})`,
        sessionId,
      };
    }

    const results: Array<{
      number: string;
      success: boolean;
      timestamp: string;
      error?: string;
    }> = [];
    let successCount = 0;
    let failCount = 0;

    // Enviar para cada número com delay entre envios
    for (const number of sendBulkMessageDto.numbers) {
      try {
        // 🔥 NOVO: Usar sendMessageOnly para evitar duplicação
        await this.sessionService.sendMessageOnly(
          sessionId,
          number,
          sendBulkMessageDto.message,
        );

        results.push({
          number,
          success: true,
          timestamp: new Date().toISOString(),
        });
        successCount++;

        // Delay de 1 segundo entre envios para evitar spam
        if (
          number !==
          sendBulkMessageDto.numbers[sendBulkMessageDto.numbers.length - 1]
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.push({
          number,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString(),
        });
        failCount++;
      }
    }

    return {
      success: successCount > 0,
      sessionId,
      message: sendBulkMessageDto.message,
      totalNumbers: sendBulkMessageDto.numbers.length,
      successCount,
      failCount,
      results,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':sessionId/status')
  @MessageSwaggerEndpoint.GetAllMessages()
  async getSessionStatus(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const session = await this.sessionService.findOneByCompany(
      sessionId,
      user.companyId,
    );

    if (!session) {
      return {
        sessionId,
        exists: false,
        canSendMessages: false,
        error: 'Sessão não encontrada ou não pertence à sua empresa',
      };
    }

    const canSendMessages = session.status === 'connected';

    return {
      sessionId,
      exists: true,
      status: session.status,
      canSendMessages,
      clientInfo: session.clientInfo || null,
      lastActiveAt: session.lastActiveAt,
      message: canSendMessages
        ? 'Sessão pronta para enviar mensagens'
        : `Sessão não pode enviar mensagens (status: ${session.status})`,
    };
  }
}
