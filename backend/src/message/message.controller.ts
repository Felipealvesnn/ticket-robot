import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { SessionService } from '../session/session.service';
import { SendBulkMessageDto } from './dto/send-bulk-message.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Mensagens WhatsApp')
@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly sessionService: SessionService) {}

  @Post(':sessionId/send')
  @ApiOperation({
    summary: '💬 Enviar mensagem via WhatsApp',
    description:
      'Envia uma mensagem através da sessão especificada. A sessão deve pertencer à empresa do usuário autenticado e estar conectada.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Mensagem enviada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        sessionId: { type: 'string', example: 'minha-sessao' },
        recipient: { type: 'string', example: '5511999999999' },
        message: { type: 'string', example: 'Olá! Como você está?' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Sessão não conectada ou dados inválidos',
  })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
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
  @ApiOperation({
    summary: '📢 Enviar mensagem em massa',
    description:
      'Envia a mesma mensagem para múltiplos números. A sessão deve pertencer à empresa do usuário autenticado.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Relatório de envio das mensagens',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        sessionId: { type: 'string' },
        totalNumbers: { type: 'number' },
        successCount: { type: 'number' },
        failCount: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'string' },
              success: { type: 'boolean' },
              timestamp: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: '📊 Status da sessão para envio de mensagens',
    description:
      'Verifica se a sessão está pronta para enviar mensagens. Considera apenas sessões da empresa do usuário.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Status da sessão',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        exists: { type: 'boolean' },
        status: { type: 'string' },
        canSendMessages: { type: 'boolean' },
        clientInfo: { type: 'object' },
        lastActiveAt: { type: 'string', format: 'date-time' },
        message: { type: 'string' },
      },
    },
  })
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
