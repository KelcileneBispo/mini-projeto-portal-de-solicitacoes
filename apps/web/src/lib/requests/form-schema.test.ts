import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  requestFormSchema,
  toRequestPayload,
  toUpdateRequestPayload,
} from './form-schema';

function messages(value: {
  title: string;
  description: string;
  category: string;
}): string[] {
  const parsed = requestFormSchema.safeParse(value);

  if (parsed.success) {
    return [];
  }

  return parsed.error.issues.map((issue) => issue.message);
}

describe('formulário de solicitação', () => {
  it('recusa campos obrigatórios vazios', () => {
    const errors = messages({ title: '   ', description: ' ', category: '' });

    assert.deepEqual(errors, [
      'Informe o título.',
      'Informe a descrição.',
      'Selecione a categoria.',
    ]);
  });

  it('recusa título e descrição fora dos limites', () => {
    const errors = messages({
      title: 'ab',
      description: 'curta',
      category: 'OUTRA',
    });

    assert.deepEqual(errors, [
      'Título deve ter entre 3 e 120 caracteres',
      'Descrição deve ter entre 10 e 2000 caracteres',
      'Selecione a categoria.',
    ]);
  });

  it('aceita o formulário e envia somente título, descrição e categoria', () => {
    const parsed = requestFormSchema.parse({
      title: '  Troca de teclado  ',
      description: '  O teclado da estação parou de funcionar.  ',
      category: 'TI',
      status: 'CONCLUIDO',
      requesterId: 9,
    });
    const created = toRequestPayload(parsed);
    const updated = toUpdateRequestPayload(parsed);

    assert.deepEqual(created, {
      title: 'Troca de teclado',
      description: 'O teclado da estação parou de funcionar.',
      category: 'TI',
    });
    assert.deepEqual(Object.keys(created), [
      'title',
      'description',
      'category',
    ]);
    assert.deepEqual(updated, created);
  });
});
