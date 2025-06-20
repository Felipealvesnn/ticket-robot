/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
