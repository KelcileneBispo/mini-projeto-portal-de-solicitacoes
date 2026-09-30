import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyRequestFilters,
  buildRequestsPath,
  clearRequestFilters,
  emptyFilters,
  hasActiveFilters,
} from './filters';

describe('filtros da listagem', () => {
  it('omite parâmetros vazios e envia a combinação aplicada', () => {
    assert.equal(
      buildRequestsPath(emptyFilters(), 1),
      '/requests?page=1&limit=20',
    );
    assert.equal(
      buildRequestsPath(
        {
          title: '  vpn  ',
          category: 'TI',
          status: 'ABERTO',
          from: '2026-09-01',
          to: '2026-09-30',
        },
        2,
        20,
      ),
      '/requests?page=2&limit=20&category=TI&status=ABERTO&title=vpn&from=2026-09-01&to=2026-09-30',
    );
  });

  it('volta para a página 1 ao aplicar ou limpar', () => {
    const draft = {
      ...emptyFilters(),
      category: 'RH' as const,
      title: 'cadastro',
    };
    const applied = applyRequestFilters(draft);
    const cleared = clearRequestFilters();

    assert.equal(applied.page, 1);
    assert.equal(applied.filters.category, 'RH');
    assert.equal(cleared.page, 1);
    assert.deepEqual(cleared.filters, emptyFilters());
    assert.equal(hasActiveFilters(draft), true);
    assert.equal(hasActiveFilters(cleared.filters), false);
  });
});
