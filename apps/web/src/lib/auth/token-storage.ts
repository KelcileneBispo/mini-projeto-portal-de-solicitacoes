const TOKEN_KEY = 'portal.accessToken';

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(TOKEN_KEY);
}
