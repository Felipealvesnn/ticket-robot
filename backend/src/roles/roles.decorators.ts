import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const RolesSwaggerEndpoint = {
  GetAll: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Listar todas as roles disponíveis',
        description:
          'Retorna uma lista de todas as roles disponíveis no sistema',
      }),
      ApiResponse({
        status: 200,
        description: 'Lista de roles retornada com sucesso',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clq1234567890abcdef' },
              name: { type: 'string', example: 'COMPANY_OWNER' },
              description: {
                type: 'string',
                example: 'Proprietário da empresa',
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      }),
      ApiUnauthorizedResponse({
        description: 'Token inválido ou usuário não autenticado',
      }),
      ApiBearerAuth(),
    ),
};
