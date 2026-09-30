import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RequestCategory } from '../../../generated/prisma/enums.js';

function trimText({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function wasSent(_object: object, value: unknown): boolean {
  return value !== undefined;
}

export class UpdateRequestDto {
  @ValidateIf(wasSent)
  @Transform(trimText)
  @IsString({ message: 'Título deve ser um texto' })
  @MinLength(3, { message: 'Título deve ter entre 3 e 120 caracteres' })
  @MaxLength(120, { message: 'Título deve ter entre 3 e 120 caracteres' })
  title?: string;

  @ValidateIf(wasSent)
  @Transform(trimText)
  @IsString({ message: 'Descrição deve ser um texto' })
  @MinLength(10, { message: 'Descrição deve ter entre 10 e 2000 caracteres' })
  @MaxLength(2000, {
    message: 'Descrição deve ter entre 10 e 2000 caracteres',
  })
  description?: string;

  @ValidateIf(wasSent)
  @IsEnum(RequestCategory, { message: 'Categoria inválida' })
  category?: RequestCategory;
}
