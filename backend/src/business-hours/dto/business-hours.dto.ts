/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateBusinessHoursDto {
  @ApiProperty({
    description: 'Dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    description: 'Se a empresa trabalha neste dia',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Horário de início (formato HH:mm)',
    example: '08:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime deve estar no formato HH:mm (ex: 08:00)',
  })
  startTime: string;

  @ApiProperty({
    description: 'Horário de fim (formato HH:mm)',
    example: '17:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime deve estar no formato HH:mm (ex: 17:00)',
  })
  endTime: string;

  @ApiProperty({
    description: 'Horário de início do intervalo/almoço (formato HH:mm)',
    example: '12:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'breakStart deve estar no formato HH:mm (ex: 12:00)',
  })
  breakStart?: string;

  @ApiProperty({
    description: 'Horário de fim do intervalo/almoço (formato HH:mm)',
    example: '13:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'breakEnd deve estar no formato HH:mm (ex: 13:00)',
  })
  breakEnd?: string;

  @ApiProperty({
    description: 'Timezone da empresa',
    example: 'America/Sao_Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateBusinessHoursDto {
  @ApiProperty({
    description: 'Se a empresa trabalha neste dia',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Horário de início (formato HH:mm)',
    example: '08:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime deve estar no formato HH:mm (ex: 08:00)',
  })
  startTime?: string;

  @ApiProperty({
    description: 'Horário de fim (formato HH:mm)',
    example: '17:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime deve estar no formato HH:mm (ex: 17:00)',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Horário de início do intervalo/almoço (formato HH:mm)',
    example: '12:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'breakStart deve estar no formato HH:mm (ex: 12:00)',
  })
  breakStart?: string;

  @ApiProperty({
    description: 'Horário de fim do intervalo/almoço (formato HH:mm)',
    example: '13:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'breakEnd deve estar no formato HH:mm (ex: 13:00)',
  })
  breakEnd?: string;

  @ApiProperty({
    description: 'Timezone da empresa',
    example: 'America/Sao_Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CreateHolidayDto {
  @ApiProperty({
    description: 'Nome do feriado ou dia especial',
    example: 'Natal',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Data do feriado',
    example: '2024-12-25T00:00:00.000Z',
  })
  @IsString()
  date: string;

  @ApiProperty({
    description: 'Tipo do dia especial',
    example: 'HOLIDAY',
    enum: ['HOLIDAY', 'SPECIAL_HOURS', 'CLOSED'],
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Horário especial de início (apenas para SPECIAL_HOURS)',
    example: '10:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime?: string;

  @ApiProperty({
    description: 'Horário especial de fim (apenas para SPECIAL_HOURS)',
    example: '14:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Se o feriado se repete anualmente',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({
    description: 'Descrição adicional',
    example: 'Feriado nacional - empresa fechada',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateHolidayDto {
  @ApiProperty({
    description: 'Nome do feriado ou dia especial',
    example: 'Natal',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Data do feriado',
    example: '2024-12-25T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description: 'Tipo do dia especial',
    example: 'HOLIDAY',
    enum: ['HOLIDAY', 'SPECIAL_HOURS', 'CLOSED'],
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Horário especial de início (apenas para SPECIAL_HOURS)',
    example: '10:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime?: string;

  @ApiProperty({
    description: 'Horário especial de fim (apenas para SPECIAL_HOURS)',
    example: '14:00',
    required: false,
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Se o feriado se repete anualmente',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({
    description: 'Descrição adicional',
    example: 'Feriado nacional - empresa fechada',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
