/* eslint-disable prettier/prettier */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsEmail,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Minha Empresa LTDA',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Slug único da empresa (usado na URL)',
    example: 'minha-empresa',
    pattern: '^[a-z0-9-]+$',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Plano da empresa',
    example: 'FREE',
    enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
    default: 'FREE',
    type: 'string',
  })
  @IsEnum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE'])
  @IsOptional()
  plan?: string = 'FREE';
}

export class UpdateCompanyDto {
  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Minha Empresa LTDA Atualizada',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Plano da empresa',
    example: 'PRO',
    enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
    required: false,
    type: 'string',
  })
  @IsEnum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE'])
  @IsOptional()
  plan?: string;

  @ApiProperty({
    description: 'Status ativo da empresa',
    example: true,
    required: false,
    type: 'boolean',
  })
  @IsOptional()
  isActive?: boolean;
}

export class AddUserToCompanyDto {
  @ApiProperty({
    description: 'Email do usuário a ser adicionado',
    example: 'usuario@empresa.com',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({
    description: 'ID do role a ser atribuído',
    example: 'clq1234567890abcdef',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  roleId: string;
}

export class CreateCompanyWithUserDto {
  @ApiProperty({
    description: 'Email do usuário proprietário',
    example: 'proprietario@empresa.com',
    format: 'email',
    type: 'string',
  })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({
    description: 'Senha do usuário proprietário (mínimo 6 caracteres)',
    example: 'MinhaSenh@123',
    minLength: 6,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  userPassword: string;

  @ApiProperty({
    description: 'Nome completo do usuário proprietário',
    example: 'João Silva',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Minha Empresa LTDA',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'Slug único da empresa (usado na URL)',
    example: 'minha-empresa',
    pattern: '^[a-z0-9-]+$',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  companySlug: string;

  @ApiProperty({
    description: 'Plano da empresa',
    example: 'FREE',
    enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
    default: 'FREE',
    type: 'string',
  })
  @IsEnum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE'])
  @IsOptional()
  companyPlan?: string = 'FREE';
}
