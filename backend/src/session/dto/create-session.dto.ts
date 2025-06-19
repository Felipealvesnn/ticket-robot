import { IsNotEmpty, IsString, Matches, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty({ message: 'Nome da sessão é obrigatório' })
  @IsString({ message: 'Nome da sessão deve ser uma string' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Nome da sessão deve conter apenas letras, números, hífens e underscores',
  })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
