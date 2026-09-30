import 'reflect-metadata';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
} from '@nestjs/common/constants.js';
import { AuthController } from './auth.controller.js';
import { UNAUTHENTICATED_MESSAGE } from './auth.constants.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { PublicUser } from './public-user.js';

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();
  const user: PublicUser = {
    id: 1,
    name: 'Ana Souza',
    username: 'ana',
  };

  it('entrega o usuário autenticado ao controller', () => {
    assert.deepEqual(guard.handleRequest(null, user), user);
  });

  it('responde 401 para token ausente, inválido ou expirado', () => {
    for (const args of [
      [null, false],
      [new Error('jwt expired'), false],
      [new Error('invalid token'), false],
    ] as const) {
      assert.throws(
        () => guard.handleRequest(args[0], args[1]),
        (error: unknown) => {
          assert.ok(error instanceof UnauthorizedException);
          const body = error.getResponse() as {
            message: string;
            statusCode: number;
          };
          assert.equal(body.message, UNAUTHENTICATED_MESSAGE);
          assert.equal(body.statusCode, 401);
          assert.equal(JSON.stringify(body).includes('jwt'), false);
          return true;
        },
      );
    }
  });
});

describe('rotas de auth', () => {
  it('protege /auth/me e /auth/logout e deixa o login público', () => {
    const meGuards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.me,
    ) as unknown[];
    const logoutGuards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.logout,
    ) as unknown[];
    const loginGuards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.login,
    ) as unknown[] | undefined;

    assert.equal(meGuards.includes(JwtAuthGuard), true);
    assert.equal(logoutGuards.includes(JwtAuthGuard), true);
    assert.equal(loginGuards, undefined);
    assert.equal(
      Reflect.getMetadata(HTTP_CODE_METADATA, AuthController.prototype.login),
      200,
    );
    assert.equal(
      Reflect.getMetadata(HTTP_CODE_METADATA, AuthController.prototype.logout),
      204,
    );
  });
});
