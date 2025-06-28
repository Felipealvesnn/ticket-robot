/* eslint-disable prettier/prettier */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário para login',
    example: 'admin@ticketrobot.com',
    format: 'email',
    type: 'string',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'Admin123!',
    minLength: 6,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Latitude da localização do usuário (opcional)',
    example: -23.5505,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude da localização do usuário (opcional)',
    example: -46.6333,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Precisão da localização em metros (opcional)',
    example: 10.5,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class RegisterDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@empresa.com',
    format: 'email',
    type: 'string',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de refresh para renovar o access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ChangeCompanyDto {
  @ApiProperty({
    description: 'ID da empresa para trocar o contexto',
    example: 'clq1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;
}

export class FirstLoginPasswordDto {
  @ApiProperty({
    description: 'Senha atual (temporária "123")',
    example: '123',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha do usuário (mínimo 6 caracteres)',
    example: 'MinhaNovaSenh@123',
    minLength: 6,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
