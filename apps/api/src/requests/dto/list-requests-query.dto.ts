import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Validate,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import {
  RequestCategory,
  RequestStatus,
} from '../../../generated/prisma/enums.js';
import { parseUtcDay } from '../utc-day.js';

@ValidatorConstraint({ name: 'isUtcDay', async: false })
class IsUtcDayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && parseUtcDay(value) !== null;
  }

  defaultMessage(): string {
    return 'Data deve estar no formato YYYY-MM-DD';
  }
}

@ValidatorConstraint({ name: 'periodNotInverted', async: false })
class PeriodNotInvertedConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string') {
      return true;
    }

    const from = (args.object as ListRequestsQueryDto).from;

    if (!from) {
      return true;
    }

    const start = parseUtcDay(from);
    const end = parseUtcDay(value);

    if (!start || !end) {
      return true;
    }

    return start.getTime() <= end.getTime();
  }

  defaultMessage(): string {
    return 'A data inicial não pode ser posterior à data final';
  }
}

export class ListRequestsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um inteiro maior ou igual a 1' })
  @Min(1, { message: 'Página deve ser um inteiro maior ou igual a 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um inteiro de 1 a 100' })
  @Min(1, { message: 'Limite deve ser um inteiro de 1 a 100' })
  @Max(100, { message: 'Limite deve ser um inteiro de 1 a 100' })
  limit?: number;

  @IsOptional()
  @IsEnum(RequestCategory, { message: 'Categoria inválida' })
  category?: RequestCategory;

  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Status inválido' })
  status?: RequestStatus;

  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @IsOptional()
  @IsString({ message: 'Título deve ser um texto' })
  @MaxLength(120, { message: 'Título deve ter no máximo 120 caracteres' })
  title?: string;

  @IsOptional()
  @Validate(IsUtcDayConstraint)
  from?: string;

  @IsOptional()
  @Validate(IsUtcDayConstraint)
  @Validate(PeriodNotInvertedConstraint)
  to?: string;
}
