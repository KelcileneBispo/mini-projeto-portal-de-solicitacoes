import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { emptyFilters } from './filters';
import {
  refreshAfterDelete,
  refreshRequestQueries,
  requestDetailQueryKey,
  requestsQueryKey,
} from './query';

function clientWithRequestData(): QueryClient {
  const client = new QueryClient();
  client.setQueryData([...requestsQueryKey, emptyFilters(), 1, 20], {
    data: [],
  });
  client.setQueryData(['dashboard'], {
    total: 1,
    open: 1,
    inProgress: 0,
    completed: 0,
  });
  client.setQueryData(requestDetailQueryKey(4), { id: 4 });

  return client;
}

describe('consultas após mutação', () => {
  it('invalida listagem, detalhe e dashboard depois de criar, editar ou mudar status', async () => {
    const client = clientWithRequestData();

    await refreshRequestQueries(client, 4);

    const queries = client.getQueryCache().getAll();
    assert.equal(queries.length, 3);
    assert.equal(
      queries.every((query) => query.state.isInvalidated),
      true,
    );
  });

  it('remove o detalhe e atualiza listagem e dashboard depois de excluir', async () => {
    const client = clientWithRequestData();

    await refreshAfterDelete(client, 4);

    assert.equal(client.getQueryData(requestDetailQueryKey(4)), undefined);
    const queries = client.getQueryCache().getAll();
    assert.equal(
      queries.some((query) => query.queryKey[0] === 'request'),
      false,
    );
    assert.equal(
      queries.every((query) => query.state.isInvalidated),
      true,
    );
  });
});
