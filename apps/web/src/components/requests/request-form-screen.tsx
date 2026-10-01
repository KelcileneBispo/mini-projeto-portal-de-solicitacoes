'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { ApiError } from '@/lib/api/client';
import { createRequest, getRequest, updateRequest } from '@/lib/api/requests';
import {
  canModifyRequest,
  modifyBlockedMessage,
  parseRequestId,
  requestActionErrorMessage,
} from '@/lib/requests/actions';
import {
  emptyRequestForm,
  toRequestPayload,
  toUpdateRequestPayload,
  type RequestFormValues,
} from '@/lib/requests/form-schema';
import {
  refreshRequestQueries,
  requestDetailQueryKey,
} from '@/lib/requests/query';
import { ActionError } from './feedback-banner';
import { LoadError } from './load-error';
import { RequestForm } from './request-form';
import {
  RequestDetailSkeleton,
  RequestUnavailable,
} from './request-detail-view';

export function CreateRequestScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: RequestFormValues) {
    setFormError(null);

    try {
      const created = await createRequest(toRequestPayload(values));
      await refreshRequestQueries(queryClient);
      router.push(`/requests/${created.id}?aviso=criada`);
    } catch (error) {
      setFormError(requestActionErrorMessage(error));
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Nova solicitação
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          A solicitação será aberta em seu nome.
        </p>
      </div>
      {formError ? <ActionError message={formError} /> : null}
      <RequestForm
        mode="create"
        initialValues={emptyRequestForm}
        onSubmit={onSubmit}
        onCancel={() => {
          router.push('/');
        }}
      />
    </section>
  );
}

type EditRequestScreenProps = {
  requestId: string;
};

export function EditRequestScreen({ requestId }: EditRequestScreenProps) {
  const id = parseRequestId(requestId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const requestQuery = useQuery({
    queryKey: requestDetailQueryKey(id ?? 0),
    queryFn: () => getRequest(id ?? 0),
    enabled: id !== null,
  });

  if (id === null) {
    return (
      <RequestUnavailable
        title="Solicitação não encontrada"
        message="Solicitação não encontrada"
      />
    );
  }

  if (requestQuery.isPending || !user) {
    return <RequestDetailSkeleton />;
  }

  if (requestQuery.isError) {
    if (
      requestQuery.error instanceof ApiError &&
      requestQuery.error.status === 404
    ) {
      return (
        <RequestUnavailable
          title="Solicitação não encontrada"
          message="Solicitação não encontrada"
        />
      );
    }

    return (
      <LoadError
        message="Não foi possível carregar a solicitação."
        onRetry={() => {
          void requestQuery.refetch();
        }}
      />
    );
  }

  const request = requestQuery.data;

  if (!request) {
    return <RequestDetailSkeleton />;
  }

  if (!canModifyRequest(request, user.id)) {
    return (
      <RequestUnavailable
        title="Edição indisponível"
        message={
          modifyBlockedMessage(request, user.id) ??
          'Apenas solicitações abertas podem ser editadas'
        }
      />
    );
  }

  async function onSubmit(values: RequestFormValues) {
    setFormError(null);

    try {
      const updated = await updateRequest(
        request.id,
        toUpdateRequestPayload(values),
      );
      queryClient.setQueryData(requestDetailQueryKey(request.id), updated);
      await refreshRequestQueries(queryClient, request.id);
      router.push(`/requests/${request.id}?aviso=atualizada`);
    } catch (error) {
      setFormError(requestActionErrorMessage(error));
      await refreshRequestQueries(queryClient, request.id);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Editar solicitação
        </h1>
        <p className="mt-2 text-sm text-slate-600">Código {request.id}</p>
      </div>
      {formError ? <ActionError message={formError} /> : null}
      <RequestForm
        mode="edit"
        initialValues={{
          title: request.title,
          description: request.description,
          category: request.category,
        }}
        onSubmit={onSubmit}
        onCancel={() => {
          router.push(`/requests/${request.id}`);
        }}
      />
    </section>
  );
}
