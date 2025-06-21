import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import {
  AssignTicketDto,
  CreateTicketDto,
  TicketCommentDto,
  UpdateTicketDto,
} from './dto/ticket.dto';
import { TicketService } from './ticket.service';

@ApiTags('Tickets de Atendimento')
@Controller('ticket')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @ApiOperation({
    summary: 'Criar novo ticket',
    description: 'Cria um novo ticket de atendimento para a empresa.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        title: { type: 'string', example: 'Problema com entrega' },
        status: { type: 'string', example: 'OPEN' },
        priority: { type: 'string', example: 'MEDIUM' },
        contact: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'João Silva' },
            phoneNumber: { type: 'string', example: '+5511999999999' },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos ou recursos não encontrados',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createTicketDto: CreateTicketDto,
  ) {
    return await this.ticketService.create(user.companyId, createTicketDto);
  }

  @ApiOperation({
    summary: 'Listar tickets da empresa',
    description: 'Retorna todos os tickets da empresa com filtros opcionais.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por status',
    enum: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'],
  })
  @ApiQuery({
    name: 'assignedAgentId',
    required: false,
    description: 'Filtrar por ID do agente responsável',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tickets retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clq1234567890abcdef' },
          title: { type: 'string', example: 'Problema com entrega' },
          status: { type: 'string', example: 'OPEN' },
          priority: { type: 'string', example: 'MEDIUM' },
          contact: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'João Silva' },
              phoneNumber: { type: 'string', example: '+5511999999999' },
            },
          },
          assignedAgent: {
            type: 'object',
            nullable: true,
            properties: {
              name: { type: 'string', example: 'Maria Atendente' },
              email: { type: 'string', example: 'maria@empresa.com' },
            },
          },
          _count: {
            type: 'object',
            properties: {
              messages: { type: 'number', example: 15 },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: string,
    @Query('assignedAgentId') assignedAgentId?: string,
  ) {
    return await this.ticketService.findAll(
      user.companyId,
      status,
      assignedAgentId,
    );
  }

  @ApiOperation({
    summary: 'Obter estatísticas de tickets',
    description: 'Retorna estatísticas dos tickets da empresa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        open: { type: 'number', example: 25 },
        inProgress: { type: 'number', example: 30 },
        resolved: { type: 'number', example: 80 },
        closed: { type: 'number', example: 15 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get('stats')
  async getStats(@CurrentUser() user: CurrentUserData) {
    return await this.ticketService.getStats(user.companyId);
  }

  @ApiOperation({
    summary: 'Obter meus tickets',
    description: 'Retorna todos os tickets atribuídos ao usuário atual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tickets do usuário retornados com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get('my')
  async getMyTickets(@CurrentUser() user: CurrentUserData) {
    return await this.ticketService.getMyTickets(user.companyId, user.userId);
  }

  @ApiOperation({
    summary: 'Buscar ticket por ID',
    description:
      'Retorna os detalhes completos de um ticket, incluindo mensagens e histórico.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ticket',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        title: { type: 'string', example: 'Problema com entrega' },
        description: { type: 'string', example: 'Cliente relatou problema...' },
        status: { type: 'string', example: 'OPEN' },
        priority: { type: 'string', example: 'MEDIUM' },
        messages: {
          type: 'array',
          items: { type: 'object' },
        },
        history: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Ticket não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este ticket' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.ticketService.findOne(id, user.companyId);
  }

  @ApiOperation({
    summary: 'Atualizar ticket',
    description: 'Atualiza os dados de um ticket existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ticket',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'Ticket atualizado com sucesso' })
  @ApiNotFoundResponse({ description: 'Ticket não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este ticket' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return await this.ticketService.update(
      id,
      user.companyId,
      user.userId,
      updateTicketDto,
    );
  }

  @ApiOperation({
    summary: 'Atribuir ticket a um agente',
    description: 'Atribui um ticket a um agente específico.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ticket',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'Ticket atribuído com sucesso' })
  @ApiNotFoundResponse({ description: 'Ticket não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este ticket' })
  @ApiBadRequestResponse({
    description: 'Agente não encontrado ou não pertence à empresa',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Patch(':id/assign')
  async assign(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() assignTicketDto: AssignTicketDto,
  ) {
    return await this.ticketService.assign(
      id,
      user.companyId,
      user.userId,
      assignTicketDto,
    );
  }

  @ApiOperation({
    summary: 'Fechar ticket',
    description: 'Fecha um ticket com comentário opcional.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ticket',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket fechado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Ticket fechado com sucesso' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Ticket não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este ticket' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Patch(':id/close')
  async close(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() commentDto?: TicketCommentDto,
  ) {
    return await this.ticketService.close(
      id,
      user.companyId,
      user.userId,
      commentDto,
    );
  }
}
