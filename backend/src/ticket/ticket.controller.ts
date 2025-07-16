/* eslint-disable prettier/prettier */
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/interfaces/current-user.interface';
import {
  AssignTicketDto,
  CreateTicketDto,
  TicketCommentDto,
  UpdateTicketDto,
} from './dto/ticket.dto';
import { TicketSchedulerService } from './ticket-scheduler.service';
import { TicketSwaggerEndpoint } from './ticket.decorators';
import { TicketService } from './ticket.service';

@ApiTags('Tickets de Atendimento')
@Controller('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly ticketSchedulerService: TicketSchedulerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @TicketSwaggerEndpoint.CreateTicket()
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createTicketDto: CreateTicketDto,
  ) {
    return await this.ticketService.create(user.companyId, createTicketDto);
  }

  @Get()
  @TicketSwaggerEndpoint.FindAllTickets()
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: string,
    @Query('assignedAgentId') assignedAgentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    return await this.ticketService.findAll(
      user.companyId,
      status,
      assignedAgentId,
      pageNum,
      limitNum,
      search,
    );
  }

  @TicketSwaggerEndpoint.GetTicketStats()
  @Get('stats')
  async getStats(@CurrentUser() user: CurrentUserData) {
    return await this.ticketService.getStats(user.companyId);
  }

  @TicketSwaggerEndpoint.GetTicketById()
  @Get('my')
  async getMyTickets(@CurrentUser() user: CurrentUserData) {
    return await this.ticketService.getMyTickets(user.companyId, user.userId);
  }

  @TicketSwaggerEndpoint.GetTicketById()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return await this.ticketService.findOne(id, user.companyId);
  }

  @TicketSwaggerEndpoint.UpdateTicket()
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

  @TicketSwaggerEndpoint.AssignTicket()
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

  @TicketSwaggerEndpoint.CloseTicket()
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

  /**
   * 🔧 Forçar fechamento de tickets inativos
   */
  @Post('close-inactive')
  @HttpCode(HttpStatus.OK)
  async forceCloseInactiveTickets(
    @CurrentUser() user: CurrentUserData,
    @Query('companyId') targetCompanyId?: string,
  ) {
    // Usar sempre a empresa do usuário atual (sem verificação de admin por enquanto)
    const companyId = user.companyId;

    return await this.ticketSchedulerService.forceCloseInactiveTickets(
      companyId,
    );
  }

  /**
   * 📊 Estatísticas em tempo real
   */
  @Get('stats/realtime')
  async getRealTimeStats(@CurrentUser() user: CurrentUserData) {
    return await this.ticketSchedulerService.getRealTimeStats();
  }

  /**
   * 📨 Buscar mensagens de um ticket
   */
  @Get(':id/messages')
  async getTicketMessages(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const ticket = await this.ticketService.findOne(id, user.companyId);

    // Transformar as mensagens para o formato esperado pelo frontend
    const messages =
      ticket.messages?.map((message) => ({
        ...message,
        // Converter direção do banco (INCOMING/OUTGOING) para o formato do frontend (INBOUND/OUTBOUND)
        direction: message.direction === 'INCOMING' ? 'INBOUND' : 'OUTBOUND',
        // Converter tipo para messageType
        messageType: message.type,
        // Adicionar status padrão se não existir
        status: 'DELIVERED', // ou alguma lógica para determinar o status real
      })) || [];

    return messages;
  }

  /**
   * 📤 Enviar mensagem para um ticket
   */
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async sendTicketMessage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body()
    messageData: {
      content: string;
      messageType?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let fileData: string | undefined;
    let fileName: string | undefined;
    let mimeType: string | undefined;

    if (file) {
      fileData = file.buffer.toString('base64');
      fileName = file.originalname;
      mimeType = file.mimetype;
    }

    return await this.ticketService.sendMessage(
      id,
      user.companyId,
      user.userId,
      {
        ...messageData,
        fileData,
        fileName,
        mimeType,
      },
    );
  }

  /**
   * 🔄 Reabrir ticket
   */
  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  async reopenTicket(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() commentDto?: TicketCommentDto,
  ) {
    return await this.ticketService.reopen(
      id,
      user.companyId,
      user.userId,
      commentDto,
    );
  }
}
