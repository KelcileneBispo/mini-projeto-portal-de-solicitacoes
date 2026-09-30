import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { categoryLabel, statusLabel } from './labels';

describe('rótulos de solicitação', () => {
  it('traduz categoria e status para a interface', () => {
    assert.equal(categoryLabel('TI'), 'TI');
    assert.equal(categoryLabel('RH'), 'RH');
    assert.equal(categoryLabel('COMPRAS'), 'Compras');
    assert.equal(categoryLabel('FINANCEIRO'), 'Financeiro');
    assert.equal(categoryLabel('INFRAESTRUTURA'), 'Infraestrutura');
    assert.equal(statusLabel('ABERTO'), 'Aberto');
    assert.equal(statusLabel('EM_ATENDIMENTO'), 'Em Atendimento');
    assert.equal(statusLabel('CONCLUIDO'), 'Concluído');
  });
});
