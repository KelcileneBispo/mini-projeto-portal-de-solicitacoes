import type { RequestCategory, RequestStatus } from '../../types/api';

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  TI: 'TI',
  RH: 'RH',
  COMPRAS: 'Compras',
  FINANCEIRO: 'Financeiro',
  INFRAESTRUTURA: 'Infraestrutura',
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em Atendimento',
  CONCLUIDO: 'Concluído',
};

export const CATEGORY_OPTIONS = (
  Object.entries(CATEGORY_LABELS) as Array<[RequestCategory, string]>
).map(([value, label]) => ({ value, label }));

export const STATUS_OPTIONS = (
  Object.entries(STATUS_LABELS) as Array<[RequestStatus, string]>
).map(([value, label]) => ({ value, label }));

export function categoryLabel(category: string): string {
  if (category in CATEGORY_LABELS) {
    return CATEGORY_LABELS[category as RequestCategory];
  }

  return category;
}

export function statusLabel(status: string): string {
  if (status in STATUS_LABELS) {
    return STATUS_LABELS[status as RequestStatus];
  }

  return status;
}
