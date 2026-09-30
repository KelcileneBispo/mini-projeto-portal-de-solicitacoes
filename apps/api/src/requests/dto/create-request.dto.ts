import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RequestCategory } from '../../../generated/prisma/enums.js';

function trimText({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateRequestDto {
  @Transform(trimText)
  @IsString({ message: 'Título deve ser um texto' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MinLength(3, { message: 'Título deve ter entre 3 e 120 caracteres' })
  @MaxLength(120, { message: 'Título deve ter entre 3 e 120 caracteres' })
  title!: string;

  @Transform(trimText)
  @IsString({ message: 'Descrição deve ser um texto' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MinLength(10, { message: 'Descrição deve ter entre 10 e 2000 caracteres' })
  @MaxLength(2000, {
    message: 'Descrição deve ter entre 10 e 2000 caracteres',
  })
  description!: string;

  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  @IsEnum(RequestCategory, { message: 'Categoria inválida' })
  category!: RequestCategory;
}
