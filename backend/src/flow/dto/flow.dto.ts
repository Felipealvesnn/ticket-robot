/* eslint-disable prettier/prettier */
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlowDto {
  @ApiProperty({
    description: 'Nome do fluxo de chat',
    example: 'Atendimento Inicial',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descrição do fluxo',
    example: 'Fluxo para captar informações iniciais do cliente',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Nós do React Flow (JSON string)',
    example:
      '[{"id":"1","type":"input","data":{"label":"Início"},"position":{"x":100,"y":100}}]',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  nodes: string;

  @ApiProperty({
    description: 'Conexões do React Flow (JSON string)',
    example: '[{"id":"e1-2","source":"1","target":"2"}]',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  edges: string;

  @ApiProperty({
    description: 'Triggers/palavras-chave que ativam o fluxo (JSON string)',
    example: '["oi", "olá", "bom dia", "boa tarde"]',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  triggers: string;

  @ApiProperty({
    description: 'Se o fluxo está ativo',
    example: true,
    default: false,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = false;
}

export class UpdateFlowDto {
  @ApiProperty({
    description: 'Nome do fluxo de chat',
    example: 'Atendimento Inicial Atualizado',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Descrição do fluxo',
    example: 'Fluxo atualizado para captar informações iniciais do cliente',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Nós do React Flow (JSON string)',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  nodes?: string;

  @ApiProperty({
    description: 'Conexões do React Flow (JSON string)',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  edges?: string;

  @ApiProperty({
    description: 'Triggers/palavras-chave que ativam o fluxo (JSON string)',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  triggers?: string;

  @ApiProperty({
    description: 'Se o fluxo está ativo',
    required: false,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
