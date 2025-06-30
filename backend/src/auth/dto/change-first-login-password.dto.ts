import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeFirstLoginPasswordDto {
  @ApiProperty({
    description: 'Senha atual (senha padrão)',
    example: '123',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 8 caracteres)',
    example: 'MinhaNovaSenh@456',
    minLength: 8,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
