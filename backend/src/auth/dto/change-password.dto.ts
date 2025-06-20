/* eslint-disable prettier/prettier */
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Email do usuário para alteração de senha',
    example: 'email@gmail.com',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  userEmail: string;

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
