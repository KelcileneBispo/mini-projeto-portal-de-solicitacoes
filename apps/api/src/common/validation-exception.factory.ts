import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

const CONSTRAINT_PRIORITY = [
  'whitelistValidation',
  'isNotEmpty',
  'isDefined',
  'isString',
  'isInt',
  'isEnum',
  'minLength',
  'maxLength',
  'min',
  'max',
  'matches',
] as const;

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: 'Dados inválidos',
    details: errors.flatMap((error) => fieldDetails(error)),
  });
}

function fieldDetails(
  error: ValidationError,
): Array<{ field: string; message: string }> {
  const message = preferredMessage(error);

  if (message) {
    return [{ field: error.property, message }];
  }

  return (error.children ?? []).flatMap((child) =>
    fieldDetails(child).map((detail) => ({
      field: `${error.property}.${detail.field}`,
      message: detail.message,
    })),
  );
}

function preferredMessage(error: ValidationError): string | undefined {
  const constraints = error.constraints;

  if (!constraints) {
    return undefined;
  }

  if (constraints.whitelistValidation) {
    return 'Campo não permitido';
  }

  for (const key of CONSTRAINT_PRIORITY) {
    const message = constraints[key];

    if (message) {
      return message;
    }
  }

  return Object.values(constraints)[0];
}
