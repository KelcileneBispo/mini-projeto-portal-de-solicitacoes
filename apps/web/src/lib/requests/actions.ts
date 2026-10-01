import { ApiError } from '../api/client';
import type { RequestDetail, RequestStatus } from '../../types/api';

export const REQUEST_NOTICES = {
  criada: 'Solicitação criada com sucesso.',
  atualizada: 'Solicitação atualizada com sucesso.',
  excluida: 'Solicitação excluída com sucesso.',
  status: 'Status atualizado com sucesso.',
} as const;

export type RequestNotice = keyof typeof REQUEST_NOTICES;

const STATUS_ACTIONS: Record<
  Exclude<RequestStatus, 'CONCLUIDO'>,
  { status: Exclude<RequestStatus, 'ABERTO'>; label: string }
> = {
  ABERTO: {
    status: 'EM_ATENDIMENTO',
    label: 'Colocar em atendimento',
  },
  EM_ATENDIMENTO: {
    status: 'CONCLUIDO',
    label: 'Concluir solicitação',
  },
};

export function requestNoticeMessage(
  notice: string | undefined,
): string | null {
  if (notice !== undefined && notice in REQUEST_NOTICES) {
    return REQUEST_NOTICES[notice as RequestNotice];
  }

  return null;
}

export function parseRequestId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

export function canModifyRequest(
  request: Pick<RequestDetail, 'status' | 'requester'>,
  userId: number,
): boolean {
  return request.status === 'ABERTO' && request.requester.id === userId;
}

export function nextStatusAction(
  status: RequestStatus,
): { status: Exclude<RequestStatus, 'ABERTO'>; label: string } | null {
  if (status === 'CONCLUIDO') {
    return null;
  }

  return STATUS_ACTIONS[status];
}

export function requestActionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Não foi possível concluir a operação.';
}

export function modifyBlockedMessage(
  request: Pick<RequestDetail, 'status' | 'requester'>,
  userId: number,
): string | null {
  if (request.requester.id !== userId) {
    return 'Você só pode alterar suas próprias solicitações';
  }

  if (request.status !== 'ABERTO') {
    return 'Apenas solicitações abertas podem ser editadas';
  }

  return null;
}
