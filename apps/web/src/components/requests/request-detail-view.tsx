import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/icons';
import { formatOpenedAt } from '@/lib/requests/format-date';
import { canModifyRequest, nextStatusAction } from '@/lib/requests/actions';
import { categoryLabel } from '@/lib/requests/labels';
import type { RequestDetail } from '@/types/api';
import { ActionError, FeedbackBanner } from './feedback-banner';
import { ConfirmDialog } from './confirm-dialog';
import { StatusBadge } from './status-badge';

type RequestDetailViewProps = {
  request: RequestDetail;
  currentUserId: number;
  notice: string | null;
  errorMessage: string | null;
  confirm: 'delete' | 'status' | null;
  pendingAction: 'delete' | 'status' | null;
  onAskDelete: () => void;
  onAskStatus: () => void;
  onCancelConfirm: () => void;
  onConfirmDelete: () => void;
  onConfirmStatus: () => void;
};

export function RequestDetailView({
  request,
  currentUserId,
  notice,
  errorMessage,
  confirm,
  pendingAction,
  onAskDelete,
  onAskStatus,
  onCancelConfirm,
  onConfirmDelete,
  onConfirmStatus,
}: RequestDetailViewProps) {
  const canModify = canModifyRequest(request, currentUserId);
  const statusAction = nextStatusAction(request.status);
  const busy = pendingAction !== null;

  return (
    <article className="space-y-6">
      <BackToList />
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Código {request.id}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {request.title}
          </h1>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {notice ? <FeedbackBanner message={notice} /> : null}
      {errorMessage ? <ActionError message={errorMessage} /> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <dl className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-slate-500">Descrição</dt>
            <dd className="mt-2 text-sm whitespace-pre-wrap text-slate-900">
              {request.description}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Categoria</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {categoryLabel(request.category)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Solicitante</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {request.requester.name}
              <span className="mt-0.5 block text-slate-500">
                {request.requester.username}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">
              Data de abertura
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              {formatOpenedAt(request.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Status</dt>
            <dd className="mt-1 text-sm text-slate-900">
              <StatusBadge status={request.status} />
            </dd>
          </div>
        </dl>

        {statusAction || canModify ? (
          <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row">
              {statusAction ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white outline-none hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={busy}
                  onClick={onAskStatus}
                >
                  {statusAction.label}
                </button>
              ) : null}
              {canModify ? (
                <Link
                  href={`/requests/${request.id}/edit`}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 outline-none hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Editar
                </Link>
              ) : null}
            </div>
            {canModify ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-red-700 outline-none hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:text-red-300"
                disabled={busy}
                onClick={onAskDelete}
              >
                Excluir
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {confirm === 'delete' ? (
        <ConfirmDialog
          title="Excluir solicitação"
          description="Esta exclusão é permanente. A solicitação não poderá ser recuperada."
          confirmLabel="Excluir"
          pendingLabel="Excluindo..."
          pending={pendingAction === 'delete'}
          destructive
          onConfirm={onConfirmDelete}
          onCancel={onCancelConfirm}
        />
      ) : null}
      {confirm === 'status' && statusAction ? (
        <ConfirmDialog
          title={statusAction.label}
          description="O status da solicitação será atualizado."
          confirmLabel={statusAction.label}
          pendingLabel="Atualizando..."
          pending={pendingAction === 'status'}
          onConfirm={onConfirmStatus}
          onCancel={onCancelConfirm}
        />
      ) : null}
    </article>
  );
}

export function RequestUnavailable({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="space-y-6">
      <BackToList />
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-700" role="alert">
          {message}
        </p>
      </div>
    </div>
  );
}

function BackToList() {
  return (
    <Link
      href="/"
      aria-label="Voltar para a listagem"
      className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-slate-700 outline-none hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
    >
      <ArrowLeftIcon />
      Voltar
    </Link>
  );
}

export function RequestDetailSkeleton() {
  return (
    <div
      aria-label="Carregando solicitação"
      className="space-y-3"
      role="status"
    >
      <div className="h-8 w-2/3 animate-pulse rounded-md bg-slate-200" />
      <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}
