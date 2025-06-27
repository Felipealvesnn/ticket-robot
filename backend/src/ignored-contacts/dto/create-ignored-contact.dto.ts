import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateIgnoredContactDto {
  @ApiProperty({
    description: 'Número de telefone a ser ignorado (formato internacional)',
    example: '5511999999999',
  })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    description:
      'ID da sessão específica (opcional, se não fornecido ignora globalmente)',
    example: 'session-id-123',
  })
  @IsOptional()
  @IsString()
  messagingSessionId?: string;

  @ApiPropertyOptional({
    description: 'Nome ou descrição do contato',
    example: 'João - Número interno',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Motivo para ignorar',
    example: 'INTERNAL',
    enum: ['INTERNAL', 'TEST', 'VIP', 'BLOCKED', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['INTERNAL', 'TEST', 'VIP', 'BLOCKED', 'OTHER'])
  reason?: string;

  @ApiPropertyOptional({
    description:
      'Se true, ignora apenas respostas automáticas (bot). Se false, ignora todas as mensagens',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ignoreBotOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Número da diretoria, não deve receber mensagens automáticas',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
