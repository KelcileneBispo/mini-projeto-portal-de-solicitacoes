import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getToken, setToken } from './token-storage';
import { endSession, loadCurrentUser, startSession } from './session';

process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';

const user = { id: 1, username: 'ana', name: 'Ana Souza' };

describe('sessão', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'fetch');
  });

  it('guarda o token depois do login e não guarda a senha', async () => {
    installSessionStorage();
    mockFetch([
      jsonResponse(200, {
        accessToken: 'token-da-sessao',
        tokenType: 'Bearer',
        expiresIn: 28800,
        user,
      }),
    ]);

    const authenticated = await startSession({
      username: 'ana',
      password: 'dev-ana-123',
    });

    assert.deepEqual(authenticated, user);
    assert.equal(getToken(), 'token-da-sessao');
    assert.equal(
      JSON.stringify(window.sessionStorage).includes('dev-ana-123'),
      false,
    );
    assert.equal(
      storedValues().some((value) => value.includes('dev-ana-123')),
      false,
    );
  });

  it('remove o token no logout mesmo se a API falhar', async () => {
    installSessionStorage();
    setToken('token-da-sessao');
    mockFetch([jsonResponse(500, { message: 'Erro interno do servidor' })]);

    await endSession();

    assert.equal(getToken(), null);
  });

  it('recupera o usuário em /auth/me', async () => {
    installSessionStorage();
    setToken('token-da-sessao');
    const calls = mockFetch([jsonResponse(200, user)]);

    assert.deepEqual(await loadCurrentUser(), user);
    assert.equal(calls[0]?.url, 'http://localhost:3001/auth/me');
    assert.equal(
      calls[0]?.headers.get('authorization'),
      'Bearer token-da-sessao',
    );
  });

  it('encerra a sessão local quando /auth/me retorna 401', async () => {
    installSessionStorage();
    setToken('token-invalido');
    mockFetch([
      jsonResponse(401, { statusCode: 401, message: 'Não autenticado' }),
    ]);

    assert.equal(await loadCurrentUser(), null);
    assert.equal(getToken(), null);
  });
});

type Call = { url: string; headers: Headers };

function mockFetch(responses: Response[]): Call[] {
  const calls: Call[] = [];
  const pending = [...responses];

  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), headers: new Headers(init?.headers) });
    const response = pending.shift();
    assert.ok(response);
    return response;
  }) as typeof fetch;

  return calls;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function installSessionStorage(): Map<string, string> {
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
  return data;
}

function storedValues(): string[] {
  const data: string[] = [];
  const storage = window.sessionStorage;
  const token = storage.getItem('portal.accessToken');

  if (token) {
    data.push(token);
  }

  return data;
}
