'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { getDashboard, getRequests } from '@/lib/api/requests';
import {
  applyRequestFilters,
  clearRequestFilters,
  emptyFilters,
  hasActiveFilters,
  REQUEST_PAGE_LIMIT,
} from '@/lib/requests/filters';
import type { RequestFilters } from '@/types/api';
import { DashboardCards, DashboardCardsSkeleton } from './dashboard-cards';
import { LoadError } from './load-error';
import { RequestFiltersForm } from './request-filters';
import {
  EmptyRequests,
  RequestList,
  RequestListSkeleton,
} from './request-list';
import { RequestPagination } from './request-pagination';

export function RequestsScreen() {
  const [draft, setDraft] = useState<RequestFilters>(emptyFilters);
  const [applied, setApplied] = useState<RequestFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });
  const listQuery = useQuery({
    queryKey: ['requests', applied, page, REQUEST_PAGE_LIMIT],
    queryFn: () => getRequests(applied, page, REQUEST_PAGE_LIMIT),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Solicitações
      </h1>

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
