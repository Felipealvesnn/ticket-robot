/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class SendBulkMessageDto {
  @ApiProperty({
    description: 'Lista de números para envio (formato: 5511999999999)',
    example: ['5511999999999', '5511888888888'],
    type: [String],
  })
  @IsNotEmpty({ message: 'Lista de números é obrigatória' })
  @IsArray({ message: 'Números deve ser um array' })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos um número' })
  @IsString({ each: true, message: 'Cada número deve ser uma string' })
  @Matches(/^\d{10,15}$/, {
    each: true,
    message:
      'Cada número deve conter apenas dígitos e ter entre 10 e 15 caracteres',
  })
  numbers: string[];

  @ApiProperty({
    description: 'Mensagem a ser enviada para todos os números',
    example: 'Mensagem promocional para todos!',
  })
  @IsNotEmpty({ message: 'Mensagem é obrigatória' })
  @IsString({ message: 'Mensagem deve ser uma string' })
  message: string;
}
