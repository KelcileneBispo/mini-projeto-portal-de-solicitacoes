import { statusLabel } from '@/lib/requests/labels';
import type { RequestStatus } from '@/types/api';

const STATUS_STYLES: Record<RequestStatus, string> = {
  ABERTO: 'bg-amber-100 text-amber-950',
  EM_ATENDIMENTO: 'bg-sky-100 text-sky-950',
  CONCLUIDO: 'bg-emerald-100 text-emerald-950',
};

type StatusBadgeProps = {
  status: RequestStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
