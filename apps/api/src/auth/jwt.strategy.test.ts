import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import type { AuthService } from './auth.service.js';
import type { PublicUser } from './public-user.js';

process.env.JWT_SECRET = 'unit-test-jwt-secret';
process.env.JWT_EXPIRES_IN = '8h';

describe('JwtStrategy', () => {
  it('carrega o usuário a partir do sub do token', async () => {
    const expected: PublicUser = {
      id: 1,
      name: 'Ana Souza',
      username: 'ana',
    };
    const authService = {
      findAuthenticatedUser: async (subject: unknown) => {
        assert.equal(subject, '1');
        return expected;
      },
    };
    const strategy = new JwtStrategy(authService as unknown as AuthService);
    const user = await strategy.validate({ sub: '1' });

    assert.deepEqual(user, expected);
  });
});
