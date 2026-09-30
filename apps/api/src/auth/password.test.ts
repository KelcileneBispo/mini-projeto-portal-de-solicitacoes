import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BCRYPT_COST, hashPassword, verifyPassword } from './password.js';

describe('hash de senha', () => {
  it('grava bcrypt com custo 10 e confere a senha', async () => {
    const passwordHash = await hashPassword('dev-ana-123');

    assert.match(passwordHash, new RegExp(`^\\$2[ab]\\$${BCRYPT_COST}\\$`));
    assert.equal(await verifyPassword('dev-ana-123', passwordHash), true);
    assert.equal(await verifyPassword('senha-incorreta', passwordHash), false);
  });

  it('não reutiliza o mesmo hash para a mesma senha', async () => {
    const first = await hashPassword('dev-ana-123');
    const second = await hashPassword('dev-ana-123');

    assert.notEqual(first, second);
  });
});
