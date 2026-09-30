import type {
  DashboardResponse,
  RequestFilters,
  RequestListResponse,
} from '../../types/api';
import { buildRequestsPath, REQUEST_PAGE_LIMIT } from '../requests/filters';
import { apiGet } from './client';

export function getDashboard(): Promise<DashboardResponse> {
  return apiGet<DashboardResponse>('/dashboard');
}

export function getRequests(
  filters: RequestFilters,
  page: number,
  limit = REQUEST_PAGE_LIMIT,
): Promise<RequestListResponse> {
  return apiGet<RequestListResponse>(buildRequestsPath(filters, page, limit));
}
