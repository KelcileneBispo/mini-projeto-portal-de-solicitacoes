import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError } from '../api/client';
import type { RequestDetail } from '../../types/api';
import {
  canModifyRequest,
  modifyBlockedMessage,
  nextStatusAction,
  parseRequestId,
  requestActionErrorMessage,
  requestNoticeMessage,
} from './actions';

const request: Pick<RequestDetail, 'status' | 'requester'> = {
  status: 'ABERTO',
  requester: { id: 1, name: 'Ana Souza', username: 'ana' },
};

describe('ações da solicitação', () => {
  it('permite editar e excluir só o autor enquanto está aberta', () => {
    assert.equal(canModifyRequest(request, 1), true);
    assert.equal(canModifyRequest(request, 2), false);
    assert.equal(
      canModifyRequest({ ...request, status: 'EM_ATENDIMENTO' }, 1),
      false,
    );
    assert.equal(
      canModifyRequest({ ...request, status: 'CONCLUIDO' }, 1),
      false,
    );
    assert.equal(
      modifyBlockedMessage(request, 2),
      'Você só pode alterar suas próprias solicitações',
    );
    assert.equal(
      modifyBlockedMessage({ ...request, status: 'EM_ATENDIMENTO' }, 1),
      'Apenas solicitações abertas podem ser editadas',
    );
    assert.equal(modifyBlockedMessage(request, 1), null);
  });

  it('oferece somente a próxima transição de status', () => {
    assert.deepEqual(nextStatusAction('ABERTO'), {
      status: 'EM_ATENDIMENTO',
      label: 'Colocar em atendimento',
    });
    assert.deepEqual(nextStatusAction('EM_ATENDIMENTO'), {
      status: 'CONCLUIDO',
      label: 'Concluir solicitação',
    });
    assert.equal(nextStatusAction('CONCLUIDO'), null);
  });

  it('traduz avisos e erros da API', () => {
    assert.equal(
      requestNoticeMessage('criada'),
      'Solicitação criada com sucesso.',
    );
    assert.equal(
      requestNoticeMessage('atualizada'),
      'Solicitação atualizada com sucesso.',
    );
    assert.equal(
      requestNoticeMessage('excluida'),
      'Solicitação excluída com sucesso.',
    );
    assert.equal(
      requestNoticeMessage('status'),
      'Status atualizado com sucesso.',
    );
    assert.equal(requestNoticeMessage('outra'), null);
    assert.equal(
      requestActionErrorMessage(
        new ApiError(403, 'Você só pode alterar suas próprias solicitações'),
      ),
      'Você só pode alterar suas próprias solicitações',
    );
    assert.equal(
      requestActionErrorMessage(
        new ApiError(404, 'Solicitação não encontrada'),
      ),
      'Solicitação não encontrada',
    );
    assert.equal(
      requestActionErrorMessage(
        new ApiError(409, 'Transição de status não permitida'),
      ),
      'Transição de status não permitida',
    );
    assert.equal(
      requestActionErrorMessage(new Error('falha')),
      'Não foi possível concluir a operação.',
    );
  });

  it('aceita somente o código inteiro positivo', () => {
    assert.equal(parseRequestId('15'), 15);
    assert.equal(parseRequestId('0'), null);
    assert.equal(parseRequestId('1.5'), null);
    assert.equal(parseRequestId('abc'), null);
  });
});
