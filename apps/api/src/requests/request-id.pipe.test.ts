import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpException } from '@nestjs/common';
import { RequestIdPipe } from './request-id.pipe.js';
import { INVALID_ID_MESSAGE } from './requests.errors.js';

describe('RequestIdPipe', () => {
  const pipe = new RequestIdPipe();

  it('aceita inteiro positivo', () => {
    assert.equal(pipe.transform('15'), 15);
  });

  it('recusa zero, sinal, decimal e texto', () => {
    for (const value of ['0', '-1', '1.5', '15abc', 'abc']) {
      assert.throws(
        () => pipe.transform(value),
        (error: unknown) => {
          assert.ok(error instanceof HttpException);
          assert.equal(error.getStatus(), 400);
          const body = error.getResponse() as {
            details: Array<{ field: string; message: string }>;
          };
          assert.equal(body.details[0]?.message, INVALID_ID_MESSAGE);
          return true;
        },
      );
    }
  });
});
