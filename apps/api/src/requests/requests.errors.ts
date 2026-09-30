import { BadRequestException } from '@nestjs/common';

export const REQUEST_NOT_FOUND_MESSAGE = 'Solicitação não encontrada';

export const EDIT_FORBIDDEN_MESSAGE =
  'Você só pode alterar suas próprias solicitações';

export const EDIT_CLOSED_MESSAGE =
  'Apenas solicitações abertas podem ser editadas';

export const DELETE_FORBIDDEN_MESSAGE =
  'Você só pode excluir suas próprias solicitações';

export const DELETE_CLOSED_MESSAGE =
  'Apenas solicitações abertas podem ser excluídas';

export const INVALID_TRANSITION_MESSAGE = 'Transição de status não permitida';

export const EMPTY_UPDATE_MESSAGE = 'Informe ao menos um campo para editar';

export const INVALID_ID_MESSAGE = 'Código deve ser um inteiro positivo';

export function invalidData(
  field: string,
  message: string,
): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: 'Dados inválidos',
    details: [{ field, message }],
  });
}
