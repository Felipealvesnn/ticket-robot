import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

// Decorators personalizados para o MessageController
export const MessageSwaggerEndpoint = {
  SendMessage: () =>
    applyDecorators(
      ApiOperation({
        summary: '💬 Enviar mensagem via WhatsApp',
        description:
          'Envia uma mensagem através da sessão especificada. A sessão deve pertencer à empresa do usuário autenticado e estar conectada.',
      }),
      ApiParam({ name: 'sessionId', description: 'ID da sessão WhatsApp' }),
      ApiResponse({
        status: 200,
        description: 'Mensagem enviada com sucesso',
      }),
      ApiResponse({
        status: 400,
        description: 'Sessão não conectada ou dados inválidos',
      }),
      ApiResponse({ status: 404, description: 'Sessão não encontrada' }),
    ),

  SendBulkMessage: () =>
    applyDecorators(
      ApiOperation({
        summary: '📤 Enviar mensagens em lote',
        description:
          'Envia múltiplas mensagens através da sessão especificada.',
      }),
      ApiParam({ name: 'sessionId', description: 'ID da sessão WhatsApp' }),
      ApiResponse({
        status: 200,
        description: 'Mensagens enviadas com sucesso',
      }),
    ),

  GetAllMessages: () =>
    applyDecorators(
      ApiOperation({
        summary: '📜 Obter todas as mensagens',
        description:
          'Retorna todas as mensagens de uma sessão específica com paginação.',
      }),
      ApiParam({ name: 'sessionId', description: 'ID da sessão WhatsApp' }),
      ApiResponse({
        status: 200,
        description: 'Mensagens obtidas com sucesso',
      }),
    ),
};
