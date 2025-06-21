import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SessionService } from '../session/session.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Mensagens WhatsApp')
@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly sessionService: SessionService) {}

  @Post(':sessionId/send')
  @ApiOperation({
    summary: '💬 Enviar mensagem via WhatsApp',
    description:
      'Envia uma mensagem através da sessão especificada para o número informado',
  })
  @ApiParam({ name: 'sessionId', description: 'ID/nome da sessão' })
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
    description:
      'Erro ao enviar mensagem - verifique se a sessão está conectada',
  })
  @ApiResponse({
    status: 404,
    description: 'Sessão não encontrada',
  })
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: { number: string; message: string },
  ) {
    try {
      // Verifica se a sessão existe
      const session = this.sessionService.findOne(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Sessão não encontrada',
          sessionId,
        };
      }

      // Verifica se a sessão está conectada
      if (session.status !== 'connected') {
        return {
          success: false,
          error: `Sessão está com status '${session.status}'. Apenas sessões conectadas podem enviar mensagens.`,
          sessionId,
          currentStatus: session.status,
        };
      }

      const success = await this.sessionService.sendMessage(
        sessionId,
        body.number,
        body.message,
      );

      return {
        success,
        sessionId,
        recipient: body.number,
        message: body.message,
        timestamp: new Date().toISOString(),
        sessionStatus: session.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        sessionId,
        recipient: body.number,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post(':sessionId/send-bulk')
  @ApiOperation({
    summary: '📢 Enviar mensagem em massa',
    description: 'Envia a mesma mensagem para múltiplos números',
  })
  @ApiParam({ name: 'sessionId', description: 'ID/nome da sessão' })
  @ApiResponse({
    status: 200,
    description: 'Mensagens enviadas (com relatório de sucessos/falhas)',
  })
  async sendBulkMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: { numbers: string[]; message: string },
  ) {
    try {
      const session = this.sessionService.findOne(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Sessão não encontrada',
          sessionId,
        };
      }

      if (session.status !== 'connected') {
        return {
          success: false,
          error: `Sessão não está conectada (status: ${session.status})`,
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

      for (const number of body.numbers) {
        try {
          const success = await this.sessionService.sendMessage(
            sessionId,
            number,
            body.message,
          );

          results.push({
            number,
            success,
            timestamp: new Date().toISOString(),
          });

          if (success) successCount++;
          else failCount++;

          // Aguarda 1 segundo entre envios para evitar spam
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
        message: body.message,
        totalNumbers: body.numbers.length,
        successCount,
        failCount,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        sessionId,
      };
    }
  }

  @Get(':sessionId/status')
  @ApiOperation({
    summary: '📊 Status da sessão para mensagens',
    description: 'Verifica se a sessão está pronta para enviar mensagens',
  })
  @ApiParam({ name: 'sessionId', description: 'ID/nome da sessão' })
  getMessageStatus(@Param('sessionId') sessionId: string) {
    const session = this.sessionService.findOne(sessionId);

    if (!session) {
      return {
        sessionId,
        exists: false,
        canSendMessages: false,
        error: 'Sessão não encontrada',
      };
    }

    const canSendMessages = session.status === 'connected';

    return {
      sessionId,
      exists: true,
      status: session.status,
      canSendMessages,
      clientInfo: session.clientInfo,
      lastActiveAt: session.lastActiveAt,
      message: canSendMessages
        ? 'Sessão pronta para enviar mensagens'
        : `Sessão não pode enviar mensagens (status: ${session.status})`,
    };
  }
}
