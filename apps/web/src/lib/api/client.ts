import type { ApiErrorBody, ApiErrorDetail } from '../../types/api';
import { apiBaseUrl } from '../config';
import { getToken, removeToken } from '../auth/token-storage';

const INVALID_CREDENTIALS_MESSAGE = 'Usuário ou senha inválidos';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: Method;
  body?: unknown;
  auth?: boolean;
};

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const headers = new Headers();
  const token = options.auth === false ? null : getToken();

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await readPayload(response);

  if (response.ok) {
    return payload as T;
  }

  const message = messageForStatus(response.status, payload);

  if (response.status === 401 && token) {
    removeToken();
    unauthorizedHandler?.();
  }

  throw new ApiError(
    response.status,
    message,
    isErrorBody(payload) ? payload.details : undefined,
  );
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: Pick<RequestOptions, 'auth'>,
): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, auth: options?.auth });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', body });
}

export function apiDelete(path: string): Promise<void> {
  return apiRequest<void>(path, { method: 'DELETE' });
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function messageForStatus(status: number, payload: unknown): string {
  const body = isErrorBody(payload) ? payload : null;

  if (status === 401) {
    return body?.message === INVALID_CREDENTIALS_MESSAGE
      ? INVALID_CREDENTIALS_MESSAGE
      : 'Não autenticado';
  }

  if (status === 400) {
    return (
      body?.details?.find((detail) => detail.message)?.message ??
      'Dados inválidos'
    );
  }

  if (body?.message) {
    return body.message;
  }

  if (status === 403) {
    return 'Você não tem permissão para esta ação.';
  }

  if (status === 404) {
    return 'Não encontrado.';
  }

  if (status === 409) {
    return 'Operação não permitida.';
  }

  return 'Não foi possível concluir a operação.';
}

function isErrorBody(payload: unknown): payload is ApiErrorBody {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
  );
}
