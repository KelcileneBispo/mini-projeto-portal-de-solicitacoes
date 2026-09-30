import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getToken, removeToken, setToken } from './token-storage';

describe('sessionStorage do token', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('não acessa armazenamento fora do browser', () => {
    Reflect.deleteProperty(globalThis, 'window');

    assert.equal(getToken(), null);
    assert.doesNotThrow(() => {
      setToken('segredo');
      removeToken();
    });
  });

  it('grava, lê e remove o token', () => {
    installSessionStorage();

    assert.equal(getToken(), null);
    setToken('token-da-sessao');
    assert.equal(getToken(), 'token-da-sessao');
    assert.equal(readStoredToken(), 'token-da-sessao');
    removeToken();
    assert.equal(getToken(), null);
  });
});

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

function readStoredToken(): string | null {
  return window.sessionStorage.getItem('portal.accessToken');
}
