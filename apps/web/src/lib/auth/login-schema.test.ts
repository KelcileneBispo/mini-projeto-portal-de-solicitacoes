import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loginSchema } from './login-schema';

describe('formulário de login', () => {
  it('exige usuário e senha', () => {
    const result = loginSchema.safeParse({ username: '   ', password: '' });

    assert.equal(result.success, false);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      assert.ok(messages.includes('Informe o usuário.'));
      assert.ok(messages.includes('Informe a senha.'));
    }
  });

  it('rejeita usuário curto e senha curta', () => {
    const result = loginSchema.safeParse({
      username: 'an',
      password: '1234567',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      assert.ok(
        messages.includes('O usuário deve ter entre 3 e 50 caracteres.'),
      );
      assert.ok(messages.includes('A senha deve ter entre 8 e 72 caracteres.'));
    }
  });

  it('aceita usuário e senha dentro do contrato', () => {
    const result = loginSchema.safeParse({
      username: '  Ana  ',
      password: 'dev-ana-123',
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.equal(result.data.username, 'Ana');
      assert.equal(result.data.password, 'dev-ana-123');
    }
  });
});
