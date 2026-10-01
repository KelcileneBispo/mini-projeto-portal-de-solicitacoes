import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { emptyRequestForm } from '../../lib/requests/form-schema';
import type { RequestDetail, RequestStatus } from '../../types/api';
import { RequestForm, submitButtonLabel } from './request-form';
import { RequestDetailView, RequestUnavailable } from './request-detail-view';

const request: RequestDetail = {
  id: 15,
  title: 'Acesso à VPN',
  description: 'Preciso de acesso à VPN para o trabalho remoto.',
  category: 'TI',
  status: 'ABERTO',
  createdAt: '2026-09-29T17:00:00.000Z',
  updatedAt: '2026-09-29T17:00:00.000Z',
  requester: { id: 1, name: 'Ana Souza', username: 'ana' },
};

const noop = () => undefined;

function detail(
  status: RequestStatus,
  currentUserId: number,
  confirm: 'delete' | 'status' | null = null,
): string {
  return renderToStaticMarkup(
    createElement(RequestDetailView, {
      request: { ...request, status },
      currentUserId,
      notice: status === 'ABERTO' ? 'Solicitação criada com sucesso.' : null,
      errorMessage:
        status === 'CONCLUIDO' ? 'Transição de status não permitida' : null,
      confirm,
      pendingAction: confirm,
      onAskDelete: noop,
      onAskStatus: noop,
      onCancelConfirm: noop,
      onConfirmDelete: noop,
      onConfirmStatus: noop,
    }),
  );
}

describe('detalhes e formulário', () => {
  it('mostra os dados e as ações do autor quando a solicitação está aberta', () => {
    const html = detail('ABERTO', 1);

    assert.match(html, /Código 15/);
    assert.match(html, /Acesso à VPN/);
    assert.match(html, /Preciso de acesso à VPN/);
    assert.match(html, /TI/);
    assert.match(html, /Ana Souza/);
    assert.match(html, /29\/09\/2026/);
    assert.match(html, /Solicitação criada com sucesso/);
    assert.match(html, /href="\/requests\/15\/edit"/);
    assert.match(html, />Editar</);
    assert.match(html, />Excluir</);
    assert.match(html, />Colocar em atendimento</);
  });

  it('esconde edição e exclusão de outro usuário e mantém a mudança de status', () => {
    const html = detail('ABERTO', 2);

    assert.equal(html.includes('href="/requests/15/edit"'), false);
    assert.equal(html.includes('>Excluir<'), false);
    assert.match(html, />Colocar em atendimento</);
  });

  it('esconde edição e exclusão fora de aberto e conclui o atendimento', () => {
    const html = detail('EM_ATENDIMENTO', 1);

    assert.equal(html.includes('href="/requests/15/edit"'), false);
    assert.equal(html.includes('>Excluir<'), false);
    assert.match(html, />Concluir solicitação</);
    assert.equal(html.includes('Colocar em atendimento'), false);
  });

  it('não oferece mudança de status quando está concluída', () => {
    const html = detail('CONCLUIDO', 1);

    assert.equal(html.includes('href="/requests/15/edit"'), false);
    assert.equal(html.includes('>Excluir<'), false);
    assert.equal(html.includes('Colocar em atendimento'), false);
    assert.equal(html.includes('Concluir solicitação'), false);
    assert.match(html, /Transição de status não permitida/);
  });

  it('pede confirmação permanente antes de excluir e permite cancelar', () => {
    const html = detail('ABERTO', 1, 'delete');

    assert.match(html, /Esta exclusão é permanente/);
    assert.match(html, />Cancelar</);
    assert.match(html, /Excluindo\.\.\./);
    assert.match(html, /<button[^>]*type="button"[^>]*>Cancelar/);
  });

  it('mostra a solicitação inexistente com volta para a listagem', () => {
    const html = renderToStaticMarkup(
      createElement(RequestUnavailable, {
        title: 'Solicitação não encontrada',
        message: 'Solicitação não encontrada',
      }),
    );

    assert.match(html, /Solicitação não encontrada/);
    assert.match(html, /href="\/"/);
    assert.match(html, /Voltar para a listagem/);
  });

  it('mostra o formulário de criação com os campos obrigatórios', () => {
    const html = renderToStaticMarkup(
      createElement(RequestForm, {
        mode: 'create',
        initialValues: emptyRequestForm,
        onSubmit: async () => undefined,
        onCancel: noop,
      }),
    );

    assert.match(html, /Título/);
    assert.match(html, /Descrição/);
    assert.match(html, /Categoria/);
    assert.match(html, /Criar solicitação/);
    assert.match(html, /<button[^>]*type="submit"/);
    assert.equal(submitButtonLabel('create', true), 'Criando...');
    assert.equal(submitButtonLabel('edit', false), 'Salvar alterações');
    assert.equal(submitButtonLabel('edit', true), 'Salvando...');
  });
});
