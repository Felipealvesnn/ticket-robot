/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Número do destinatário (formato: 5511999999999)',
    example: '5511999999999',
  })
  @IsNotEmpty({ message: 'Número é obrigatório' })
  @IsString({ message: 'Número deve ser uma string' })
  @Matches(/^\d{10,15}$/, {
    message: 'Número deve conter apenas dígitos e ter entre 10 e 15 caracteres',
  })
  number: string;

  @ApiProperty({
    description: 'Mensagem a ser enviada',
    example: 'Olá! Como você está?',
  })
  @IsNotEmpty({ message: 'Mensagem é obrigatória' })
  @IsString({ message: 'Mensagem deve ser uma string' })
  message: string;
}
