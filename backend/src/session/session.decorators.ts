import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

// Decorators personalizados para simplificar o controller
export const SwaggerEndpoint = {
  CreateSession: () =>
    applyDecorators(
      ApiOperation({
        summary: '🚀 Criar nova sessão WhatsApp',
        description:
          'Cria uma nova sessão e retorna o QR Code em base64 pronto para uso. O QR Code será exibido diretamente no Swagger UI! Espaços serão automaticamente convertidos em hífens.',
      }),
      ApiResponse({
        status: 400,
        description: '❌ Erro de validação ou sessão já existe',
      }),
    ),

  FindAll: () =>
    applyDecorators(
      ApiOperation({ summary: 'Listar todas as sessões da empresa' }),
      ApiResponse({
        status: 200,
        description: 'Lista de todas as sessões da empresa',
      }),
    ),

  GetStats: () =>
    applyDecorators(
      ApiOperation({
        summary: '📊 Estatísticas detalhadas das sessões',
        description:
          'Retorna estatísticas completas com contadores e lista detalhada de todas as sessões da empresa',
      }),
      ApiResponse({
        status: 200,
        description: 'Estatísticas detalhadas das sessões',
      }),
    ),

  CleanupInactive: () =>
    applyDecorators(
      ApiOperation({
        summary: '🧹 Limpar sessões inativas',
        description:
          'Remove sessões inativas tanto da memória quanto do banco de dados',
      }),
    ),

  SyncSessions: () =>
    applyDecorators(
      ApiOperation({
        summary: '🔄 Sincronizar status das sessões',
        description:
          'Sincroniza o status das sessões entre memória e banco de dados',
      }),
    ),

  GetQRCode: () =>
    applyDecorators(
      ApiOperation({
        summary: '📱 Obter QR Code (texto)',
        description:
          'Retorna o QR Code em formato string para a sessão especificada',
      }),
      ApiParam({ name: 'id', description: 'ID/nome da sessão' }),
      ApiResponse({
        status: 200,
        description: 'QR Code em formato string',
      }),
      ApiResponse({
        status: 404,
        description: 'QR Code não disponível - sessão pode já estar conectada',
      }),
    ),

  GetQRCodeImage: () =>
    applyDecorators(
      ApiOperation({
        summary: '🖼️ Obter QR Code (imagem base64)',
        description:
          'Retorna o QR Code como imagem em base64. A imagem será exibida diretamente no Swagger UI!',
      }),
      ApiParam({ name: 'id', description: 'ID/nome da sessão' }),
      ApiResponse({
        status: 200,
        description: 'QR Code como imagem base64 - exibida no Swagger',
      }),
      ApiResponse({
        status: 404,
        description: 'QR Code não disponível - sessão pode já estar conectada',
      }),
    ),

  RemoveSessionAndAllData: () =>
    applyDecorators(
      ApiOperation({
        summary: '🗑️ Remover sessão e TODOS os dados',
        description:
          '⚠️ ATENÇÃO: Remove sessão E TODOS OS DADOS associados (conversas, contatos, tickets, mensagens). Use com EXTREMO cuidado!',
      }),
      ApiResponse({
        status: 200,
        description: 'Sessão e todos os dados removidos com sucesso',
      }),
    ),

  RestartSession: () =>
    applyDecorators(
      ApiOperation({
        summary: '🔄 Reiniciar cliente WhatsApp',
        description:
          '🔄 Reinicia APENAS o cliente WhatsApp da sessão, preservando todas as conversas, contatos, tickets e mensagens. Ideal para resolver problemas de conexão sem perder dados.',
      }),
      ApiResponse({
        status: 200,
        description:
          'Cliente WhatsApp reiniciado com sucesso. Dados preservados.',
      }),
    ),

  GetSessionDetails: () =>
    applyDecorators(
      ApiOperation({
        summary: '📋 Obter detalhes completos da sessão',
        description:
          'Retorna informações detalhadas incluindo dados do banco e status de conexão',
      }),
    ),

  GetConversationHistory: () =>
    applyDecorators(
      ApiOperation({
        summary: '📜 Histórico de conversa',
        description: 'Busca o histórico completo de mensagens de uma sessão',
      }),
      ApiParam({ name: 'sessionId', description: 'ID da sessão' }),
    ),

  GetMessageStats: () =>
    applyDecorators(
      ApiOperation({
        summary: '📊 Estatísticas de mensagens',
        description: 'Retorna estatísticas das mensagens por período',
      }),
    ),

  ForceReconnection: () =>
    applyDecorators(
      ApiOperation({
        summary: '🔄 Forçar reconexão de sessão',
        description:
          'Força a reconexão de uma sessão que está desconectada ou com problemas.',
      }),
      ApiParam({
        name: 'sessionId',
        description: 'ID da sessão a ser reconectada',
        example: 'minha-sessao-whatsapp',
      }),
      ApiResponse({
        status: 200,
        description: 'Reconexão iniciada com sucesso',
      }),
      ApiResponse({
        status: 404,
        description: 'Sessão não encontrada',
      }),
    ),

  GetReconnectionStatus: () =>
    applyDecorators(
      ApiOperation({
        summary: '📊 Status de reconexão das sessões',
        description:
          'Retorna o status atual das tentativas de reconexão de todas as sessões.',
      }),
      ApiResponse({
        status: 200,
        description: 'Status de reconexão obtido com sucesso',
      }),
    ),

  ResetReconnectionCounters: () =>
    applyDecorators(
      ApiOperation({
        summary: '🔄 Resetar contadores de reconexão',
        description:
          'Reseta todos os contadores de tentativas de reconexão para recomeçar do zero.',
      }),
      ApiResponse({
        status: 200,
        description: 'Contadores resetados com sucesso',
      }),
    ),
};
