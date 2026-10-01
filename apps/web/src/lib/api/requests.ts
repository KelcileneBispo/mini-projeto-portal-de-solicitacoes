import type {
  CreateRequestPayload,
  DashboardResponse,
  RequestDetail,
  RequestFilters,
  RequestListResponse,
  UpdateRequestPayload,
  UpdateRequestStatusPayload,
} from '../../types/api';
import { buildRequestsPath, REQUEST_PAGE_LIMIT } from '../requests/filters';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

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

export function getRequest(id: number): Promise<RequestDetail> {
  return apiGet<RequestDetail>(`/requests/${id}`);
}

export function createRequest(
  payload: CreateRequestPayload,
): Promise<RequestDetail> {
  return apiPost<RequestDetail>('/requests', payload);
}

export function updateRequest(
  id: number,
  payload: UpdateRequestPayload,
): Promise<RequestDetail> {
  return apiPatch<RequestDetail>(`/requests/${id}`, payload);
}

export function deleteRequest(id: number): Promise<void> {
  return apiDelete(`/requests/${id}`);
}

export function updateRequestStatus(
  id: number,
  payload: UpdateRequestStatusPayload,
): Promise<RequestDetail> {
  return apiPatch<RequestDetail>(`/requests/${id}/status`, payload);
}
