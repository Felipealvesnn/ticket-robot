import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const MediaSwaggerEndpoint = {
  Upload: () =>
    applyDecorators(
      ApiOperation({ summary: 'Upload de arquivo de mídia' }),
      ApiConsumes('multipart/form-data'),
      ApiResponse({
        status: 201,
        description: 'Arquivo enviado com sucesso',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  Download: () =>
    applyDecorators(
      ApiOperation({ summary: 'Download de arquivo por ID' }),
      ApiResponse({
        status: 200,
        description: 'Arquivo baixado com sucesso',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  View: () =>
    applyDecorators(
      ApiOperation({ summary: 'Visualizar arquivo (imagem/video)' }),
      ApiResponse({
        status: 200,
        description: 'Arquivo visualizado com sucesso',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  GetPublicUrl: () =>
    applyDecorators(
      ApiOperation({ summary: 'Obter URL pública do arquivo' }),
      ApiResponse({
        status: 200,
        description: 'URL pública gerada com sucesso',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  ListFiles: () =>
    applyDecorators(
      ApiOperation({ summary: 'Listar arquivos da empresa' }),
      ApiResponse({
        status: 200,
        description: 'Lista de arquivos retornada com sucesso',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  GetStats: () =>
    applyDecorators(
      ApiOperation({ summary: 'Estatísticas de uso de storage' }),
      ApiResponse({
        status: 200,
        description: 'Estatísticas retornadas com sucesso',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),

  Delete: () =>
    applyDecorators(
      ApiOperation({ summary: 'Deletar arquivo' }),
      ApiResponse({
        status: 200,
        description: 'Arquivo deletado com sucesso',
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),
};
