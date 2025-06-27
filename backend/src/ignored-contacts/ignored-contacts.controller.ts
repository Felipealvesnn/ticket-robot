import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import { CreateIgnoredContactDto } from './dto/create-ignored-contact.dto';
import { UpdateIgnoredContactDto } from './dto/update-ignored-contact.dto';
import { IgnoredContactsService } from './ignored-contacts.service';

@ApiTags('🚫 Contatos Ignorados')
@Controller('ignored-contacts')
@UseGuards(JwtAuthGuard)
export class IgnoredContactsController {
  constructor(
    private readonly ignoredContactsService: IgnoredContactsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: '➕ Adicionar número à lista de ignorados',
    description:
      'Cadastra um número que não deve receber respostas automáticas do chatbot',
  })
  @ApiResponse({
    status: 201,
    description: 'Contato adicionado à lista de ignorados com sucesso',
  })
  @ApiResponse({
    status: 409,
    description: 'Número já está na lista de ignorados',
  })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createIgnoredContactDto: CreateIgnoredContactDto,
  ) {
    const result = await this.ignoredContactsService.create(
      user.companyId,
      user.userId,
      createIgnoredContactDto,
    );

    return {
      message: '✅ Número adicionado à lista de ignorados com sucesso',
      data: result,
    };
  }

  @Get()
  @ApiOperation({
    summary: '📋 Listar contatos ignorados',
    description: 'Lista todos os contatos ignorados da empresa',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description: 'Filtrar por sessão específica',
  })
  @ApiQuery({
    name: 'global',
    required: false,
    description: 'Mostrar apenas ignorados globais',
  })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('sessionId') sessionId?: string,
    @Query('global') global?: string,
  ) {
    let result;

    if (sessionId) {
      result = await this.ignoredContactsService.findBySession(
        user.companyId,
        sessionId,
      );
    } else if (global === 'true') {
      result = await this.ignoredContactsService.findGlobal(user.companyId);
    } else {
      result = await this.ignoredContactsService.findAllByCompany(
        user.companyId,
      );
    }

    return {
      total: result.length,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: '📊 Estatísticas de contatos ignorados',
    description: 'Retorna estatísticas dos contatos ignorados',
  })
  async getStats(@CurrentUser() user: CurrentUserData) {
    const stats = await this.ignoredContactsService.getStats(user.companyId);
    return {
      message: 'Estatísticas dos contatos ignorados',
      data: stats,
    };
  }

  @Get('check/:phoneNumber')
  @ApiOperation({
    summary: '🔍 Verificar se número deve ser ignorado',
    description: 'Verifica se um número específico está na lista de ignorados',
  })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Número de telefone para verificar',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description: 'ID da sessão para verificação específica',
  })
  @ApiQuery({
    name: 'botMessage',
    required: false,
    description: 'Se é uma mensagem do bot (default: true)',
  })
  async checkNumber(
    @CurrentUser() user: CurrentUserData,
    @Param('phoneNumber') phoneNumber: string,
    @Query('sessionId') sessionId?: string,
    @Query('botMessage') botMessage?: string,
  ) {
    const isBotMessage = botMessage !== 'false';
    const result = await this.ignoredContactsService.shouldIgnoreContact(
      user.companyId,
      phoneNumber,
      sessionId,
      isBotMessage,
    );

    return {
      phoneNumber,
      shouldIgnore: result.shouldIgnore,
      reason: result.reason,
      isBotMessage,
      sessionId: sessionId || 'global',
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: '🔍 Buscar contato ignorado por ID',
    description: 'Retorna detalhes de um contato ignorado específico',
  })
  async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    const result = await this.ignoredContactsService.findOne(
      id,
      user.companyId,
    );
    return {
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: '✏️ Atualizar contato ignorado',
    description: 'Atualiza informações de um contato ignorado',
  })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() updateIgnoredContactDto: UpdateIgnoredContactDto,
  ) {
    const result = await this.ignoredContactsService.update(
      id,
      user.companyId,
      updateIgnoredContactDto,
    );

    return {
      message: '✅ Contato ignorado atualizado com sucesso',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: '🗑️ Remover da lista de ignorados',
    description: 'Remove um número da lista de contatos ignorados',
  })
  async remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    await this.ignoredContactsService.remove(id, user.companyId);
    return {
      message: '✅ Número removido da lista de ignorados com sucesso',
    };
  }
}
