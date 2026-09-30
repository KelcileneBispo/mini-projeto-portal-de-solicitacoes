import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { ApiError, apiRequest, setUnauthorizedHandler } from './client';
import { getToken, setToken } from '../auth/token-storage';

process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';

describe('cliente HTTP', () => {
  afterEach(() => {
    setUnauthorizedHandler(null);
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'fetch');
  });

  it('envia Bearer quando existe token e omite o header sem token', async () => {
    installSessionStorage();
    const calls = mockFetch(200, { id: 1, username: 'ana', name: 'Ana Souza' });

    await apiRequest('/auth/me');
    setToken('token-da-sessao');
    await apiRequest('/auth/me');

    assert.equal(header(calls[0]), null);
    assert.equal(header(calls[1]), 'Bearer token-da-sessao');
    assert.equal(calls[0]?.url, 'http://localhost:3001/auth/me');
  });

  it('remove a sessão quando uma chamada autenticada recebe 401', async () => {
    installSessionStorage();
    setToken('token-invalido');
    mockFetch(401, { statusCode: 401, message: 'Não autenticado' });
    let cleared = 0;
    setUnauthorizedHandler(() => {
      cleared += 1;
    });

    await assert.rejects(
      apiRequest('/auth/me'),
      (error: unknown) => error instanceof ApiError && error.status === 401,
    );
    assert.equal(getToken(), null);
    assert.equal(cleared, 1);
  });

  it('mantém a sessão local quando o login falha', async () => {
    installSessionStorage();
    mockFetch(401, {
      statusCode: 401,
      message: 'Usuário ou senha inválidos',
    });

    await assert.rejects(
      apiRequest('/auth/login', {
        method: 'POST',
        auth: false,
        body: { username: 'ana', password: 'senha-errada' },
      }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 401 &&
        error.message === 'Usuário ou senha inválidos',
    );
    assert.equal(getToken(), null);
  });
});

type Call = { url: string; headers: Headers };

function mockFetch(status: number, body: unknown): Call[] {
  const calls: Call[] = [];

  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({
      url: String(url),
      headers: new Headers(init?.headers),
    });
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  return calls;
}

function header(call: Call | undefined): string | null {
  return call?.headers.get('authorization') ?? null;
}

function installSessionStorage(): void {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      sessionStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => {
          data.set(key, value);
        },
        removeItem: (key: string) => {
          data.delete(key);
        },
      },
    },
  });
}
