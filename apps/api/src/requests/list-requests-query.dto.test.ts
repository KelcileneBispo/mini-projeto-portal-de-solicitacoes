import 'reflect-metadata';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { validationExceptionFactory } from '../common/validation-exception.factory.js';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto.js';

async function invalidFields(query: object): Promise<string[]> {
  const dto = plainToInstance(ListRequestsQueryDto, query);
  const errors = await validate(dto);
  return errors.map((error) => error.property).sort();
}

describe('consulta da listagem', () => {
  it('rejeita categoria, status, página, limite e período inválidos', async () => {
    assert.deepEqual(await invalidFields({ category: 'INVALIDA' }), [
      'category',
    ]);
    assert.deepEqual(await invalidFields({ status: 'INVALIDO' }), ['status']);
    assert.deepEqual(await invalidFields({ page: 'abc' }), ['page']);
    assert.deepEqual(await invalidFields({ page: 0 }), ['page']);
    assert.deepEqual(await invalidFields({ limit: 0 }), ['limit']);
    assert.deepEqual(await invalidFields({ limit: 101 }), ['limit']);
    assert.deepEqual(await invalidFields({ from: '2026-02-31' }), ['from']);
    assert.deepEqual(await invalidFields({ from: '30/09/2026' }), ['from']);
    assert.deepEqual(
      await invalidFields({ from: '2026-09-30', to: '2026-09-01' }),
      ['to'],
    );
  });

  it('ignora título vazio e aceita o período válido', async () => {
    const dto = plainToInstance(ListRequestsQueryDto, {
      title: '   ',
      from: '2026-09-01',
      to: '2026-09-30',
      category: 'TI',
      status: 'ABERTO',
      page: '2',
      limit: '100',
    });
    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.title, undefined);
    assert.equal(dto.page, 2);
    assert.equal(dto.limit, 100);
  });

  it('formata o erro 400 do limite', () => {
    const exception = validationExceptionFactory([
      {
        property: 'limit',
        constraints: { max: 'Limite deve ser um inteiro de 1 a 100' },
        children: [],
      },
    ]);
    const body = exception.getResponse() as { statusCode: number };

    assert.equal(body.statusCode, 400);
  });
});
