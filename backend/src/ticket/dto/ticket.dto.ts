import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    description: 'ID da sessão de mensageria',
    example: 'clq1234567890abcdef',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  messagingSessionId: string;

  @ApiProperty({
    description: 'ID do contato',
    example: 'clq9876543210fedcba',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @ApiProperty({
    description: 'Título do ticket',
    example: 'Problema com entrega do produto',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descrição detalhada do problema',
    example:
      'Cliente relatou que o produto não foi entregue no prazo esperado.',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Prioridade do ticket',
    example: 'MEDIUM',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
    type: 'string',
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: string = 'MEDIUM';

  @ApiProperty({
    description: 'Categoria do problema',
    example: 'Entrega',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'ID do agente responsável',
    example: 'clq5555555555555555',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  assignedAgentId?: string;
}

export class UpdateTicketDto {
  @ApiProperty({
    description: 'Título do ticket',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descrição detalhada do problema',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Status do ticket',
    enum: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'],
    required: false,
    type: 'string',
  })
  @IsEnum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Prioridade do ticket',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    required: false,
    type: 'string',
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: string;

  @ApiProperty({
    description: 'Categoria do problema',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'ID do agente responsável',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  assignedAgentId?: string;
}

export class AssignTicketDto {
  @ApiProperty({
    description: 'ID do agente a ser atribuído ao ticket',
    example: 'clq5555555555555555',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  agentId: string;
}

export class TicketCommentDto {
  @ApiProperty({
    description: 'Comentário sobre a mudança no ticket',
    example: 'Ticket resolvido após contato com fornecedor',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
