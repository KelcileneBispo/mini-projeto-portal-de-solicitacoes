import 'reflect-metadata';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { validationExceptionFactory } from '../common/validation-exception.factory.js';
import { LoginDto } from './dto/login.dto.js';

describe('LoginDto', () => {
  it('exige usuário e senha', async () => {
    const errors = await validate(plainToInstance(LoginDto, {}));
    const body = validationExceptionFactory(errors).getResponse() as {
      details: Array<{ field: string; message: string }>;
    };

    assert.deepEqual(body.details, [
      { field: 'username', message: 'Usuário é obrigatório' },
      { field: 'password', message: 'Senha é obrigatória' },
    ]);
  });

  it('normaliza o username e aceita a senha de desenvolvimento', async () => {
    const dto = plainToInstance(LoginDto, {
      username: ' Ana ',
      password: 'dev-ana-123',
    });
    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.username, 'ana');
  });

  it('formata o erro 400 sem detalhe interno', () => {
    const exception = validationExceptionFactory([
      {
        property: 'password',
        constraints: {
          minLength: 'Senha deve ter entre 8 e 72 caracteres',
        },
        children: [],
      },
      {
        property: 'extra',
        constraints: {
          whitelistValidation: 'property extra should not exist',
        },
        children: [],
      },
    ]);
    const body = exception.getResponse() as {
      statusCode: number;
      message: string;
      details: Array<{ field: string; message: string }>;
    };

    assert.equal(body.statusCode, 400);
    assert.equal(body.message, 'Dados inválidos');
    assert.deepEqual(body.details, [
      {
        field: 'password',
        message: 'Senha deve ter entre 8 e 72 caracteres',
      },
      { field: 'extra', message: 'Campo não permitido' },
    ]);
  });
});
