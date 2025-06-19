import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Nome único para identificar a sessão',
    example: 'minha-sessao',
    minLength: 1,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9_-]+$',
  })
  @IsNotEmpty({ message: 'Nome da sessão é obrigatório' })
  @IsString({ message: 'Nome da sessão deve ser uma string' })
  @Length(1, 50, { message: 'Nome deve ter entre 1 e 50 caracteres' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Remove espaços no início e fim, e substitui espaços internos por hífens
      return value.trim().replace(/\s+/g, '-').toLowerCase();
    }
    return value;
  })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Nome deve conter apenas letras, números, hífens e underscores',
  })
  name: string;
}
