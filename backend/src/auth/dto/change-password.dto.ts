/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description:
      'Email do usuário para alteração de senha (preenchido automaticamente)',
    example: 'email@gmail.com',
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  userEmail?: string;

  @ApiProperty({
    description: 'Senha atual',
    example: '123',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 6 caracteres)',
    example: 'MinhaNovaSenh@456',
    minLength: 6,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
