/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { CreateFlowDto, UpdateFlowDto } from './dto/flow.dto';
import { FlowService } from './flow.service';

@ApiTags('Fluxos de Chat')
@Controller('flow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @ApiOperation({
    summary: 'Criar novo fluxo de chat',
    description: 'Cria um novo fluxo de chat para a empresa do usuário.',
  })
  @ApiResponse({
    status: 201,
    description: 'Fluxo criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        name: { type: 'string', example: 'Atendimento Inicial' },
        description: {
          type: 'string',
          example: 'Fluxo para captar informações iniciais',
        },
        isActive: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBadRequestResponse({ description: 'Dados de entrada inválidos' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createFlowDto: CreateFlowDto,
  ) {
    return await this.flowService.create(user.companyId, createFlowDto);
  }

  @ApiOperation({
    summary: 'Listar fluxos da empresa',
    description: 'Retorna todos os fluxos de chat da empresa do usuário.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de fluxos retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clq1234567890abcdef' },
          name: { type: 'string', example: 'Atendimento Inicial' },
          description: {
            type: 'string',
            example: 'Fluxo para captar informações iniciais',
          },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get()
  async findAll(@CurrentUser() user: CurrentUserData) {
    return await this.flowService.findAll(user.companyId);
  }

  @ApiOperation({
    summary: 'Buscar fluxo por ID',
    description: 'Retorna os detalhes de um fluxo específico.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do fluxo',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Fluxo encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        name: { type: 'string', example: 'Atendimento Inicial' },
        description: {
          type: 'string',
          example: 'Fluxo para captar informações iniciais',
        },
        nodes: { type: 'string', example: '[{"id":"1","type":"input"}]' },
        edges: {
          type: 'string',
          example: '[{"id":"e1-2","source":"1","target":"2"}]',
        },
        triggers: { type: 'string', example: '["oi", "olá"]' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Fluxo não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este fluxo' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.flowService.findOne(id, user.companyId);
  }

  @ApiOperation({
    summary: 'Atualizar fluxo',
    description: 'Atualiza os dados de um fluxo existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do fluxo',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'Fluxo atualizado com sucesso' })
  @ApiNotFoundResponse({ description: 'Fluxo não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este fluxo' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updateFlowDto: UpdateFlowDto,
  ) {
    return await this.flowService.update(id, user.companyId, updateFlowDto);
  }

  @ApiOperation({
    summary: 'Remover fluxo',
    description: 'Remove um fluxo de chat.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do fluxo',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Fluxo removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Fluxo removido com sucesso' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Fluxo não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este fluxo' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.flowService.remove(id, user.companyId);
  }

  @ApiOperation({
    summary: 'Alternar status ativo do fluxo',
    description: 'Ativa ou desativa um fluxo de chat.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do fluxo',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do fluxo alterado com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Fluxo não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este fluxo' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Patch(':id/toggle-active')
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return await this.flowService.toggleActive(id, user.companyId);
  }

  @ApiOperation({
    summary: 'Buscar fluxos ativos',
    description:
      'Retorna todos os fluxos ativos da empresa (para uso do chatbot).',
  })
  @ApiResponse({
    status: 200,
    description: 'Fluxos ativos retornados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clq1234567890abcdef' },
          name: { type: 'string', example: 'Atendimento Inicial' },
          triggers: { type: 'string', example: '["oi", "olá"]' },
          nodes: { type: 'string', example: '[{"id":"1","type":"input"}]' },
          edges: {
            type: 'string',
            example: '[{"id":"e1-2","source":"1","target":"2"}]',
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get('active/list')
  async getActiveFlows(@CurrentUser() user: CurrentUserData) {
    return await this.flowService.getActiveFlows(user.companyId);
  }
}
