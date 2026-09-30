import type { RequestFilters } from '../../types/api';

export const REQUEST_PAGE_LIMIT = 20;

export function emptyFilters(): RequestFilters {
  return {
    title: '',
    category: '',
    status: '',
    from: '',
    to: '',
  };
}

export function hasActiveFilters(filters: RequestFilters): boolean {
  return Boolean(
    filters.title.trim() ||
    filters.category ||
    filters.status ||
    filters.from ||
    filters.to,
  );
}

export function applyRequestFilters(filters: RequestFilters): {
  filters: RequestFilters;
  page: number;
} {
  return { filters, page: 1 };
}

export function clearRequestFilters(): {
  filters: RequestFilters;
  page: number;
} {
  return { filters: emptyFilters(), page: 1 };
}

export function buildRequestsPath(
  filters: RequestFilters,
  page: number,
  limit = REQUEST_PAGE_LIMIT,
): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  if (filters.category) {
    params.set('category', filters.category);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  const title = filters.title.trim();

  if (title) {
    params.set('title', title);
  }

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  return `/requests?${params.toString()}`;
}
