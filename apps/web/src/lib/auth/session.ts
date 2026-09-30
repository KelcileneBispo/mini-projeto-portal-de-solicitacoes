import type { LoginRequest, LoginResponse, User } from '../../types/api';
import { ApiError, apiRequest } from '../api/client';
import { getToken, removeToken, setToken } from './token-storage';

export async function startSession(input: LoginRequest): Promise<User> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: input,
    auth: false,
  });

  if (
    !response?.accessToken ||
    response.tokenType !== 'Bearer' ||
    !response.user?.id ||
    !response.user.username ||
    !response.user.name
  ) {
    throw new ApiError(500, 'Não foi possível concluir a operação.');
  }

  setToken(response.accessToken);
  return response.user;
}

export async function endSession(): Promise<void> {
  try {
    if (getToken()) {
      await apiRequest<void>('/auth/logout', { method: 'POST' });
    }
  } catch {
    // O token local sai mesmo quando a API não confirma o logout.
  } finally {
    removeToken();
  }
}

export async function loadCurrentUser(): Promise<User | null> {
  if (!getToken()) {
    return null;
  }

  try {
    return await apiRequest<User>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      removeToken();
      return null;
    }

    throw error;
  }
}
