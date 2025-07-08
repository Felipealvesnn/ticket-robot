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
  ApiConflictResponse,
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
import { ContactService } from './contact.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@ApiTags('Contatos')
@Controller('contact')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({
    summary: 'Criar novo contato',
    description: 'Cria um novo contato para a empresa.',
  })
  @ApiResponse({
    status: 201,
    description: 'Contato criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        phoneNumber: { type: 'string', example: '+5511999999999' },
        name: { type: 'string', example: 'João Silva' },
        whatsappSession: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clq9876543210fedcba' },
            name: { type: 'string', example: 'Sessão Principal' },
          },
        },
        _count: {
          type: 'object',
          properties: {
            messages: { type: 'number', example: 0 },
            tickets: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Contato com este número já existe nesta empresa',
  })
  @ApiBadRequestResponse({
    description: 'Sessão do WhatsApp não encontrada ou não pertence à empresa',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createContactDto: CreateContactDto,
  ) {
    return await this.contactService.create(user.companyId, createContactDto);
  }

  @ApiOperation({
    summary: 'Listar contatos da empresa',
    description: 'Retorna todos os contatos da empresa com filtros opcionais.',
  })
  @ApiQuery({
    name: 'whatsappSessionId',
    required: false,
    description: 'Filtrar por sessão do WhatsApp',
    type: 'string',
  })
  @ApiQuery({
    name: 'isBlocked',
    required: false,
    description: 'Filtrar por status de bloqueio',
    type: 'boolean',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contatos retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clq1234567890abcdef' },
          phoneNumber: { type: 'string', example: '+5511999999999' },
          name: { type: 'string', example: 'João Silva' },
          lastMessage: {
            type: 'string',
            example: 'Olá, gostaria de informações...',
          },
          lastMessageAt: { type: 'string', format: 'date-time' },
          isBlocked: { type: 'boolean', example: false },
          _count: {
            type: 'object',
            properties: {
              messages: { type: 'number', example: 15 },
              tickets: { type: 'number', example: 2 },
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
    @Query('messagingSessionId') messagingSessionId?: string,
    @Query('isBlocked') isBlocked?: boolean,
  ) {
    const contacts = await this.contactService.findAll(
      user.companyId,
      messagingSessionId,
      isBlocked,
    );

    return {
      contacts,
      total: contacts.length,
      hasMore: false,
    };
  }

  @ApiOperation({
    summary: 'Buscar contatos recentes',
    description: 'Retorna os contatos que enviaram mensagens recentemente.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de contatos a retornar',
    type: 'number',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Contatos recentes retornados com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get('recent')
  async getRecentContacts(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ) {
    return await this.contactService.getRecentContacts(user.companyId, limit);
  }

  @ApiOperation({
    summary: 'Pesquisar contatos',
    description: 'Pesquisa contatos por nome ou número de telefone.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Termo de pesquisa (nome ou número)',
    type: 'string',
    example: 'João',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados da pesquisa retornados com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get('search')
  async searchContacts(
    @CurrentUser() user: CurrentUserData,
    @Query('q') query: string,
  ) {
    return await this.contactService.searchContacts(user.companyId, query);
  }

  @ApiOperation({
    summary: 'Buscar contato por ID',
    description:
      'Retorna os detalhes completos de um contato, incluindo mensagens e tickets.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do contato',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Contato encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        phoneNumber: { type: 'string', example: '+5511999999999' },
        name: { type: 'string', example: 'João Silva' },
        messages: {
          type: 'array',
          description: 'Últimas 50 mensagens',
          items: { type: 'object' },
        },
        tickets: {
          type: 'array',
          description: 'Tickets em aberto',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Contato não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este contato' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.contactService.findOne(id, user.companyId);
  }

  @ApiOperation({
    summary: 'Buscar contato por número',
    description: 'Busca um contato pelo número de telefone.',
  })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Número de telefone',
    example: '+5511999999999',
  })
  @ApiResponse({
    status: 200,
    description: 'Contato encontrado com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Contato não encontrado' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Get('phone/:phoneNumber')
  async getByPhoneNumber(
    @Param('phoneNumber') phoneNumber: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return await this.contactService.getByPhoneNumber(
      user.companyId,
      phoneNumber,
    );
  }

  @ApiOperation({
    summary: 'Atualizar contato',
    description: 'Atualiza os dados de um contato existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do contato',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'Contato atualizado com sucesso' })
  @ApiNotFoundResponse({ description: 'Contato não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este contato' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return await this.contactService.update(
      id,
      user.companyId,
      updateContactDto,
    );
  }

  @ApiOperation({
    summary: 'Bloquear contato',
    description: 'Bloqueia um contato para não receber mensagens.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do contato',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'Contato bloqueado com sucesso' })
  @ApiNotFoundResponse({ description: 'Contato não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este contato' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Patch(':id/block')
  async block(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.contactService.block(id, user.companyId);
  }

  @ApiOperation({
    summary: 'Desbloquear contato',
    description: 'Desbloqueia um contato para receber mensagens novamente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do contato',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'Contato desbloqueado com sucesso' })
  @ApiNotFoundResponse({ description: 'Contato não encontrado' })
  @ApiForbiddenResponse({ description: 'Acesso negado a este contato' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido ou usuário não autenticado',
  })
  @Patch(':id/unblock')
  async unblock(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.contactService.unblock(id, user.companyId);
  }
}
