import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { emptyFilters } from '../../lib/requests/filters';
import type { RequestListItem } from '../../types/api';
import { DashboardCards } from './dashboard-cards';
import { EmptyRequests, RequestList } from './request-list';
import { RequestFiltersForm } from './request-filters';
import { RequestPagination } from './request-pagination';

function buttonDisabled(html: string, label: string): boolean {
  const match = new RegExp(`<button([^>]*)>${label}</button>`).exec(html);
  const attributes = match?.[1] ?? '';

  return /(?:^|\s)disabled(?:=""|=''|\s|>|$)/.test(attributes);
}

const item: RequestListItem = {
  id: 15,
  title: 'Acesso à VPN',
  category: 'COMPRAS',
  status: 'EM_ATENDIMENTO',
  createdAt: '2026-09-29T17:00:00.000Z',
  requester: { id: 1, name: 'Ana Souza', username: 'ana' },
};

describe('interface de solicitações', () => {
  it('mostra os quatro totais do dashboard', () => {
    const html = renderToStaticMarkup(
      createElement(DashboardCards, {
        summary: { total: 6, open: 2, inProgress: 2, completed: 2 },
      }),
    );

    assert.match(html, /Total/);
    assert.match(html, /Abertas/);
    assert.match(html, /Em atendimento/);
    assert.match(html, /Concluídas/);
    assert.match(html, />6</);
    assert.equal(html.match(/>2</g)?.length, 3);
  });

  it('mostra a listagem vazia e distingue filtros aplicados', () => {
    const plain = renderToStaticMarkup(
      createElement(EmptyRequests, { filtered: false }),
    );
    const filtered = renderToStaticMarkup(
      createElement(EmptyRequests, { filtered: true }),
    );

    assert.match(plain, /Nenhuma solicitação encontrada/);
    assert.equal(plain.includes('filtros atuais'), false);
    assert.match(filtered, /Nenhum resultado corresponde aos filtros atuais/);
  });

  it('desabilita anterior na primeira página e próxima na última', () => {
    const first = renderToStaticMarkup(
      createElement(RequestPagination, {
        page: 1,
        totalPages: 3,
        total: 45,
        onPageChange: () => undefined,
      }),
    );
    const last = renderToStaticMarkup(
      createElement(RequestPagination, {
        page: 3,
        totalPages: 3,
        total: 45,
        onPageChange: () => undefined,
      }),
    );

    assert.match(first, /45 solicitações encontradas/);
    assert.match(first, /Página 1 de 3/);
    assert.equal(buttonDisabled(first, 'Anterior'), true);
    assert.equal(buttonDisabled(first, 'Próxima'), false);
    assert.equal(buttonDisabled(last, 'Próxima'), true);
    assert.equal(buttonDisabled(last, 'Anterior'), false);
  });

  it('expõe filtrar e limpar sem disparar a busca a cada tecla', () => {
    const html = renderToStaticMarkup(
      createElement(RequestFiltersForm, {
        value: emptyFilters(),
        onChange: () => undefined,
        onApply: () => undefined,
        onClear: () => undefined,
      }),
    );

    assert.match(html, /Filtrar/);
    assert.match(html, /Limpar filtros/);
    assert.match(html, /<button[^>]*type="submit"/);
    assert.match(html, /<button[^>]*type="button"[^>]*>Limpar filtros/);
  });

  it('mostra o rótulo em português na linha da solicitação', () => {
    const html = renderToStaticMarkup(
      createElement(RequestList, { items: [item] }),
    );

    assert.match(html, /Acesso à VPN/);
    assert.match(html, /Compras/);
    assert.match(html, /Ana Souza/);
    assert.match(html, /Em Atendimento/);
    assert.match(html, /29\/09\/2026/);
  });
});
