import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
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

  @ApiProperty({
    description: 'ID do role a ser atribuído',
    example: 'clq1234567890abcdef',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'MinhaSenh@123',
    minLength: 6,
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Atualizado',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Status ativo do usuário',
    example: true,
    required: false,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'ID do role a ser atribuído',
    example: 'clq1234567890abcdef',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 6 caracteres)',
    example: 'NovaSenha@123',
    minLength: 6,
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}
