/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserPayload } from '../auth/interfaces/auth.interface';
import { BusinessHoursService } from './business-hours.service';
import {
  CreateBusinessHoursDto,
  CreateHolidayDto,
  UpdateBusinessHoursDto,
  UpdateHolidayDto,
} from './dto/business-hours.dto';

@ApiTags('Horários de Funcionamento')
@Controller('business-hours')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessHoursController {
  constructor(private readonly businessHoursService: BusinessHoursService) {}

  // ================================
  // HORÁRIOS DE FUNCIONAMENTO
  // ================================

  @ApiOperation({
    summary: 'Criar horário de funcionamento para um dia da semana',
    description:
      'Define o horário de funcionamento para um dia específico da semana.',
  })
  @ApiResponse({
    status: 201,
    description: 'Horário criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        companyId: { type: 'string', example: 'clq9876543210fedcba' },
        dayOfWeek: { type: 'number', example: 1 },
        isActive: { type: 'boolean', example: true },
        startTime: { type: 'string', example: '08:00' },
        endTime: { type: 'string', example: '17:00' },
        breakStart: { type: 'string', example: '12:00', nullable: true },
        breakEnd: { type: 'string', example: '13:00', nullable: true },
        timezone: { type: 'string', example: 'America/Sao_Paulo' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou horário já existe para este dia',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBusinessHours(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createBusinessHoursDto: CreateBusinessHoursDto,
  ) {
    return await this.businessHoursService.createBusinessHours(
      user.companyId!,
      createBusinessHoursDto,
    );
  }

  @ApiOperation({
    summary: 'Listar horários de funcionamento',
    description:
      'Retorna todos os horários de funcionamento da empresa ordenados por dia da semana.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de horários de funcionamento',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clq1234567890abcdef' },
          companyId: { type: 'string', example: 'clq9876543210fedcba' },
          dayOfWeek: { type: 'number', example: 1 },
          isActive: { type: 'boolean', example: true },
          startTime: { type: 'string', example: '08:00' },
          endTime: { type: 'string', example: '17:00' },
          breakStart: { type: 'string', example: '12:00', nullable: true },
          breakEnd: { type: 'string', example: '13:00', nullable: true },
          timezone: { type: 'string', example: 'America/Sao_Paulo' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @Get()
  async getBusinessHours(@CurrentUser() user: CurrentUserPayload) {
    return await this.businessHoursService.getBusinessHours(user.companyId!);
  }

  @ApiOperation({
    summary: 'Atualizar horário de funcionamento',
    description:
      'Atualiza o horário de funcionamento para um dia específico da semana.',
  })
  @ApiParam({
    name: 'dayOfWeek',
    description: 'Dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Horário atualizado com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Horário não encontrado para este dia',
  })
  @Put(':dayOfWeek')
  async updateBusinessHours(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dayOfWeek') dayOfWeek: string,
    @Body() updateBusinessHoursDto: UpdateBusinessHoursDto,
  ) {
    return await this.businessHoursService.updateBusinessHours(
      user.companyId!,
      parseInt(dayOfWeek),
      updateBusinessHoursDto,
    );
  }

  @ApiOperation({
    summary: 'Remover horário de funcionamento',
    description:
      'Remove o horário de funcionamento para um dia específico da semana.',
  })
  @ApiParam({
    name: 'dayOfWeek',
    description: 'Dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Horário removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Horário para Segunda-feira removido com sucesso',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Horário não encontrado para este dia',
  })
  @Delete(':dayOfWeek')
  async deleteBusinessHours(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dayOfWeek') dayOfWeek: string,
  ) {
    return await this.businessHoursService.deleteBusinessHours(
      user.companyId!,
      parseInt(dayOfWeek),
    );
  }

  // ================================
  // FERIADOS E DIAS ESPECIAIS
  // ================================

  @ApiOperation({
    summary: 'Criar feriado ou dia especial',
    description: 'Define um feriado, dia fechado ou dia com horário especial.',
  })
  @ApiResponse({
    status: 201,
    description: 'Feriado criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clq1234567890abcdef' },
        companyId: { type: 'string', example: 'clq9876543210fedcba' },
        name: { type: 'string', example: 'Natal' },
        date: { type: 'string', format: 'date-time' },
        type: { type: 'string', example: 'HOLIDAY' },
        startTime: { type: 'string', example: '10:00', nullable: true },
        endTime: { type: 'string', example: '14:00', nullable: true },
        isRecurring: { type: 'boolean', example: true },
        description: {
          type: 'string',
          example: 'Feriado nacional',
          nullable: true,
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Post('holidays')
  @HttpCode(HttpStatus.CREATED)
  async createHoliday(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createHolidayDto: CreateHolidayDto,
  ) {
    return await this.businessHoursService.createHoliday(
      user.companyId!,
      createHolidayDto,
    );
  }

  @ApiOperation({
    summary: 'Listar feriados e dias especiais',
    description:
      'Retorna todos os feriados e dias especiais da empresa, opcionalmente filtrados por ano.',
  })
  @ApiQuery({
    name: 'year',
    description: 'Ano para filtrar os feriados',
    required: false,
    example: 2024,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de feriados e dias especiais',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clq1234567890abcdef' },
          companyId: { type: 'string', example: 'clq9876543210fedcba' },
          name: { type: 'string', example: 'Natal' },
          date: { type: 'string', format: 'date-time' },
          type: { type: 'string', example: 'HOLIDAY' },
          startTime: { type: 'string', example: '10:00', nullable: true },
          endTime: { type: 'string', example: '14:00', nullable: true },
          isRecurring: { type: 'boolean', example: true },
          description: {
            type: 'string',
            example: 'Feriado nacional',
            nullable: true,
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @Get('holidays')
  async getHolidays(
    @CurrentUser() user: CurrentUserPayload,
    @Query('year') year?: string,
  ) {
    return await this.businessHoursService.getHolidays(
      user.companyId!,
      year ? parseInt(year) : undefined,
    );
  }

  @ApiOperation({
    summary: 'Atualizar feriado ou dia especial',
    description: 'Atualiza um feriado ou dia especial existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do feriado',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Feriado atualizado com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Feriado não encontrado',
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado a este feriado',
  })
  @Put('holidays/:id')
  async updateHoliday(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() updateHolidayDto: UpdateHolidayDto,
  ) {
    return await this.businessHoursService.updateHoliday(
      user.companyId!,
      id,
      updateHolidayDto,
    );
  }

  @ApiOperation({
    summary: 'Remover feriado ou dia especial',
    description: 'Remove um feriado ou dia especial.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do feriado',
    example: 'clq1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Feriado removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Feriado removido com sucesso' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Feriado não encontrado',
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado a este feriado',
  })
  @Delete('holidays/:id')
  async deleteHoliday(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return await this.businessHoursService.deleteHoliday(user.companyId!, id);
  }

  // ================================
  // UTILITÁRIOS
  // ================================

  @ApiOperation({
    summary: 'Verificar se a empresa está aberta',
    description:
      'Verifica se a empresa está aberta no momento atual ou em uma data/hora específica.',
  })
  @ApiQuery({
    name: 'datetime',
    description:
      'Data/hora para verificar (ISO string). Se não informado, usa a data/hora atual.',
    required: false,
    example: '2024-01-15T10:30:00.000Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de funcionamento da empresa',
    schema: {
      type: 'object',
      properties: {
        isOpen: { type: 'boolean', example: true },
        checkedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Get('status')
  async getBusinessStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Query('datetime') datetime?: string,
  ) {
    const checkDate = datetime ? new Date(datetime) : new Date();
    const isOpen = await this.businessHoursService.isBusinessOpen(
      user.companyId!,
      checkDate,
    );

    return {
      isOpen,
      checkedAt: checkDate.toISOString(),
    };
  }

  @ApiOperation({
    summary: 'Obter próximo horário de funcionamento',
    description: 'Retorna a próxima data/hora em que a empresa estará aberta.',
  })
  @ApiResponse({
    status: 200,
    description: 'Próximo horário de funcionamento',
    schema: {
      type: 'object',
      properties: {
        nextBusinessTime: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-16T08:00:00.000Z',
          nullable: true,
        },
      },
    },
  })
  @Get('next-business-time')
  async getNextBusinessTime(@CurrentUser() user: CurrentUserPayload) {
    const nextBusinessTime =
      await this.businessHoursService.getNextBusinessTime(user.companyId!);

    return {
      nextBusinessTime: nextBusinessTime?.toISOString() || null,
    };
  }
}
