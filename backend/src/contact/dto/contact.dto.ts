import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'ID da sessão de mensageria',
    example: 'clq1234567890abcdef',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  messagingSessionId: string;

  @ApiProperty({
    description: 'Número de telefone do contato',
    example: '+5511999999999',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Nome do contato',
    example: 'João Silva',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'URL do avatar do contato',
    example: 'https://exemplo.com/avatar.jpg',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: 'Tags do contato (JSON string)',
    example: '["vip", "cliente-fiel"]',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiProperty({
    description: 'Campos customizados (JSON string)',
    example: '{"empresa": "Tech Corp", "cargo": "Gerente"}',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  customFields?: string;
}

export class UpdateContactDto {
  @ApiProperty({
    description: 'Nome do contato',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'URL do avatar do contato',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: 'Se o contato está bloqueado',
    required: false,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean;

  @ApiProperty({
    description: 'Tags do contato (JSON string)',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiProperty({
    description: 'Campos customizados (JSON string)',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  customFields?: string;
}
