import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtVerifyOptions } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service.js';
import {
  INVALID_CREDENTIALS_MESSAGE,
  UNAUTHENTICATED_MESSAGE,
} from './auth.constants.js';
import { AuthService } from './auth.service.js';
import type { LoginDto } from './dto/login.dto.js';
import { hashPassword } from './password.js';

process.env.JWT_SECRET = 'unit-test-jwt-secret';
process.env.JWT_EXPIRES_IN = '8h';

const SECRET = 'unit-test-jwt-secret';

type StoredUser = {
  id: number;
  username: string;
  name: string;
  passwordHash: string;
};

function createHarness(users: StoredUser[]): {
  service: AuthService;
  jwtService: JwtService;
} {
  const prisma = {
    client: {
      user: {
        findUnique: async (args: {
          where: { username?: string; id?: number };
        }): Promise<StoredUser | null> => {
          if (args.where.username) {
            return (
              users.find((user) => user.username === args.where.username) ??
              null
            );
          }

          if (args.where.id !== undefined) {
            return users.find((user) => user.id === args.where.id) ?? null;
          }

          return null;
        },
      },
    },
  };
  const jwtService = new JwtService({
    secret: SECRET,
    signOptions: { expiresIn: 28_800, algorithm: 'HS256' },
  });
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwtService,
  );

  return { service, jwtService };
}

function credentialsError(error: unknown): Record<string, unknown> {
  assert.ok(error instanceof UnauthorizedException);
  const body = error.getResponse();
  assert.equal(typeof body, 'object');
  assert.ok(body);
  return body as Record<string, unknown>;
}

describe('AuthService', () => {
  it('emite JWT e o usuário público quando a senha confere', async () => {
    const passwordHash = await hashPassword('dev-ana-123');
    const { service, jwtService } = createHarness([
      {
        id: 1,
        username: 'ana',
        name: 'Ana Souza',
        passwordHash,
      },
    ]);
    const dto: LoginDto = { username: 'Ana', password: 'dev-ana-123' };
    const result = await service.login(dto);
    const payload = jwtService.verify<{ sub: string; username: string }>(
      result.accessToken,
    );

    assert.equal(result.tokenType, 'Bearer');
    assert.equal(result.expiresIn, 28_800);
    assert.deepEqual(result.user, {
      id: 1,
      name: 'Ana Souza',
      username: 'ana',
    });
    assert.equal(payload.sub, '1');
    assert.equal(payload.username, 'ana');
    assert.equal('name' in payload, false);
    assert.equal(JSON.stringify(result).includes('password'), false);
    assert.equal(JSON.stringify(payload).includes('password'), false);
  });

  it('responde igual para usuário inexistente e senha incorreta', async () => {
    const passwordHash = await hashPassword('dev-ana-123');
    const { service } = createHarness([
      {
        id: 1,
        username: 'ana',
        name: 'Ana Souza',
        passwordHash,
      },
    ]);

    const unknownUser = await service
      .login({ username: 'naoexiste', password: 'qualquer1' })
      .then(
        () => null,
        (error: unknown) => credentialsError(error),
      );
    const wrongPassword = await service
      .login({ username: 'ana', password: 'senha-incorreta' })
      .then(
        () => null,
        (error: unknown) => credentialsError(error),
      );

    assert.deepEqual(unknownUser, {
      message: INVALID_CREDENTIALS_MESSAGE,
      error: 'Unauthorized',
      statusCode: 401,
    });
    assert.deepEqual(unknownUser, wrongPassword);
  });

  it('rejeita JWT expirado e JWT assinado com outro segredo', () => {
    const jwtService = new JwtService({
      secret: SECRET,
      signOptions: { algorithm: 'HS256' },
    });
    const expired = jwtService.sign(
      { sub: '1', username: 'ana' },
      { expiresIn: -1 },
    );
    const foreign = new JwtService({
      secret: 'outro-segredo-de-teste',
      signOptions: { algorithm: 'HS256' },
    }).sign({ sub: '1', username: 'ana' }, { expiresIn: 28_800 });
    const verifyOptions: JwtVerifyOptions = { secret: SECRET };

    assert.throws(() => jwtService.verify(expired, verifyOptions));
    assert.throws(() => jwtService.verify(foreign, verifyOptions));
  });

  it('recusa sujeito ausente, inválido ou usuário removido', async () => {
    const { service } = createHarness([]);

    await assert.rejects(
      () => service.findAuthenticatedUser(undefined),
      (error: unknown) => {
        assert.ok(error instanceof UnauthorizedException);
        assert.equal(
          (error.getResponse() as { message: string }).message,
          UNAUTHENTICATED_MESSAGE,
        );
        return true;
      },
    );
    await assert.rejects(() => service.findAuthenticatedUser('0'));
    await assert.rejects(() => service.findAuthenticatedUser('1'));
  });
});
