'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { ApiError } from '@/lib/api/client';
import {
  deleteRequest,
  getRequest,
  updateRequestStatus,
} from '@/lib/api/requests';
import {
  nextStatusAction,
  parseRequestId,
  requestActionErrorMessage,
  requestNoticeMessage,
} from '@/lib/requests/actions';
import {
  refreshAfterDelete,
  refreshRequestQueries,
  requestDetailQueryKey,
} from '@/lib/requests/query';
import { LoadError } from './load-error';
import {
  RequestDetailSkeleton,
  RequestDetailView,
  RequestUnavailable,
} from './request-detail-view';

type RequestDetailScreenProps = {
  requestId: string;
  notice?: string;
};

export function RequestDetailScreen({
  requestId,
  notice,
}: RequestDetailScreenProps) {
  const id = parseRequestId(requestId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [confirm, setConfirm] = useState<'delete' | 'status' | null>(null);
  const [pendingAction, setPendingAction] = useState<
    'delete' | 'status' | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pendingRef = useRef(false);
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

  if (requestQuery.isPending) {
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

  if (!request || !user) {
    return <RequestDetailSkeleton />;
  }

  async function changeStatus() {
    const action = nextStatusAction(request.status);

    if (!action || pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    setPendingAction('status');
    setActionError(null);

    try {
      const updated = await updateRequestStatus(request.id, {
        status: action.status,
      });
      queryClient.setQueryData(requestDetailQueryKey(request.id), updated);
      await refreshRequestQueries(queryClient, request.id);
      setConfirm(null);
      router.replace(`/requests/${request.id}?aviso=status`);
    } catch (error) {
      setActionError(requestActionErrorMessage(error));
      setConfirm(null);
      await refreshRequestQueries(queryClient, request.id);
    } finally {
      pendingRef.current = false;
      setPendingAction(null);
    }
  }

  async function removeRequest() {
    if (pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    setPendingAction('delete');
    setActionError(null);

    try {
      await deleteRequest(request.id);
      await refreshAfterDelete(queryClient, request.id);
      router.push('/?aviso=excluida');
    } catch (error) {
      setActionError(requestActionErrorMessage(error));
      setConfirm(null);
      await refreshRequestQueries(queryClient, request.id);
    } finally {
      pendingRef.current = false;
      setPendingAction(null);
    }
  }

  return (
    <RequestDetailView
      request={request}
      currentUserId={user.id}
      notice={requestNoticeMessage(notice)}
      errorMessage={actionError}
      confirm={confirm}
      pendingAction={pendingAction}
      onAskDelete={() => {
        setActionError(null);
        setConfirm('delete');
      }}
      onAskStatus={() => {
        setActionError(null);
        setConfirm('status');
      }}
      onCancelConfirm={() => {
        if (!pendingAction) {
          setConfirm(null);
        }
      }}
      onConfirmDelete={() => {
        void removeRequest();
      }}
      onConfirmStatus={() => {
        void changeStatus();
      }}
    />
  );
}
