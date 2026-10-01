'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { getDashboard, getRequests } from '@/lib/api/requests';
import { requestNoticeMessage } from '@/lib/requests/actions';
import {
  applyRequestFilters,
  clearRequestFilters,
  emptyFilters,
  hasActiveFilters,
  REQUEST_PAGE_LIMIT,
} from '@/lib/requests/filters';
import { dashboardQueryKey, requestsQueryKey } from '@/lib/requests/query';
import type { RequestFilters } from '@/types/api';
import { FeedbackBanner } from './feedback-banner';
import { DashboardCards, DashboardCardsSkeleton } from './dashboard-cards';
import { LoadError } from './load-error';
import { RequestFiltersForm } from './request-filters';
import {
  EmptyRequests,
  RequestList,
  RequestListSkeleton,
} from './request-list';
import { RequestPagination } from './request-pagination';

type RequestsScreenProps = {
  notice?: string;
};

export function RequestsScreen({ notice }: RequestsScreenProps) {
  const [draft, setDraft] = useState<RequestFilters>(emptyFilters);
  const [applied, setApplied] = useState<RequestFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const successMessage = requestNoticeMessage(notice);
  const dashboardQuery = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: getDashboard,
  });
  const listQuery = useQuery({
    queryKey: [...requestsQueryKey, applied, page, REQUEST_PAGE_LIMIT],
    queryFn: () => getRequests(applied, page, REQUEST_PAGE_LIMIT),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Solicitações
        </h1>
        <Link
          href="/requests/new"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white outline-none hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Nova solicitação
        </Link>
      </div>
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}

      {dashboardQuery.isPending ? <DashboardCardsSkeleton /> : null}
      {dashboardQuery.isError ? (
        <LoadError
          message="Não foi possível carregar o resumo."
          onRetry={() => {
            void dashboardQuery.refetch();
          }}
        />
      ) : null}
      {dashboardQuery.data ? (
        <DashboardCards summary={dashboardQuery.data} />
      ) : null}

      <RequestFiltersForm
        value={draft}
        onChange={setDraft}
        onApply={() => {
          const next = applyRequestFilters(draft);
          setApplied(next.filters);
          setPage(next.page);
        }}
        onClear={() => {
          const next = clearRequestFilters();
          setDraft(next.filters);
          setApplied(next.filters);
          setPage(next.page);
        }}
      />

      {listQuery.isPending ? <RequestListSkeleton /> : null}
      {listQuery.isError ? (
        <LoadError
          message={listErrorMessage(listQuery.error)}
          onRetry={() => {
            void listQuery.refetch();
          }}
        />
      ) : null}
      {listQuery.data ? (
        <div className="space-y-4">
          {listQuery.data.data.length === 0 ? (
            <EmptyRequests filtered={hasActiveFilters(applied)} />
          ) : (
            <RequestList items={listQuery.data.data} />
          )}
          <RequestPagination
            page={listQuery.data.meta.page}
            total={listQuery.data.meta.total}
            totalPages={listQuery.data.meta.totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </div>
  );
}

function listErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 400) {
    return error.message;
  }

  return 'Não foi possível carregar as solicitações.';
}
