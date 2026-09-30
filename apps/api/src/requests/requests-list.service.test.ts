import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PrismaService } from '../prisma/prisma.service.js';
import { RequestsService } from './requests.service.js';

type Row = {
  id: number;
  title: string;
  description: string;
  category: 'TI' | 'RH' | 'COMPRAS' | 'FINANCEIRO' | 'INFRAESTRUTURA';
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
  createdAt: Date;
  requesterId: number;
};

type Where = {
  category?: Row['category'];
  status?: Row['status'];
  title?: { contains: string; mode: 'insensitive' };
  createdAt?: { gte?: Date; lt?: Date };
};

function matches(row: Row, where: Where | undefined): boolean {
  if (!where) {
    return true;
  }

  if (where.category && row.category !== where.category) {
    return false;
  }

  if (where.status && row.status !== where.status) {
    return false;
  }

  if (where.title) {
    const needle = where.title.contains
      .replace(/\\([\\%_])/g, '$1')
      .toLowerCase();

    if (!row.title.toLowerCase().includes(needle)) {
      return false;
    }
  }

  if (where.createdAt?.gte && row.createdAt < where.createdAt.gte) {
    return false;
  }

  if (where.createdAt?.lt && row.createdAt >= where.createdAt.lt) {
    return false;
  }

  return true;
}

function createListService(rows: Row[]): {
  service: RequestsService;
  wheres: Where[];
} {
  const wheres: Where[] = [];

  function filtered(where: Where | undefined): Row[] {
    if (where) {
      wheres.push(where);
    }

    return rows
      .filter((row) => matches(row, where))
      .sort((left, right) => {
        const byDate = right.createdAt.getTime() - left.createdAt.getTime();
        return byDate === 0 ? right.id - left.id : byDate;
      });
  }

  const client = {
    request: {
      count: async (args: { where?: Where }) => filtered(args.where).length,
      findMany: async (args: {
        where?: Where;
        skip?: number;
        take?: number;
        select: Record<string, unknown>;
      }) => {
        const page = filtered(args.where).slice(
          args.skip ?? 0,
          args.take === undefined ? undefined : (args.skip ?? 0) + args.take,
        );

        return page.map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          status: row.status,
          createdAt: row.createdAt,
          requester: {
            id: row.requesterId,
            name: 'Ana Souza',
            username: 'ana',
            passwordHash: 'hash-que-nao-pode-sair',
          },
        }));
      },
    },
    $transaction: async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
  };

  return {
    service: new RequestsService({ client } as unknown as PrismaService),
    wheres,
  };
}

function row(
  id: number,
  title: string,
  category: Row['category'],
  status: Row['status'],
  createdAt: string,
): Row {
  return {
    id,
    title,
    description: 'Descrição longa o bastante para o pedido.',
    category,
    status,
    createdAt: new Date(createdAt),
    requesterId: 1,
  };
}

const sample: Row[] = [
  row(1, 'Notebook não liga', 'TI', 'ABERTO', '2026-09-01T00:00:00.000Z'),
  row(
    2,
    'Problema com notebook',
    'TI',
    'EM_ATENDIMENTO',
    '2026-09-15T12:00:00.000Z',
  ),
  row(
    3,
    'Solicitação de novo notebook',
    'RH',
    'ABERTO',
    '2026-09-30T23:59:59.999Z',
  ),
  row(4, '100% pronto', 'COMPRAS', 'CONCLUIDO', '2026-10-01T00:00:00.000Z'),
  row(5, '100X pronto', 'COMPRAS', 'ABERTO', '2026-09-10T08:00:00.000Z'),
  row(6, 'a_b cabo', 'TI', 'ABERTO', '2026-09-10T09:00:00.000Z'),
  row(7, 'axb cabo', 'TI', 'ABERTO', '2026-09-10T10:00:00.000Z'),
];

describe('filtros e paginação da listagem', () => {
  it('filtra categoria, status e título parcial sem distinção de maiúsculas', async () => {
    const { service } = createListService(sample);

    const category = await service.list({ category: 'TI' });
    const status = await service.list({ status: 'ABERTO' });
    const partial = await service.list({ title: 'note' });
    const insensitive = await service.list({ title: 'NOTEBOOK' });

    assert.deepEqual(
      category.data.map((item) => item.id),
      [2, 7, 6, 1],
    );
    assert.deepEqual(
      status.data.map((item) => item.id).sort(),
      [1, 3, 5, 6, 7],
    );
    assert.deepEqual(
      partial.data.map((item) => item.id),
      [3, 2, 1],
    );
    assert.deepEqual(
      insensitive.data.map((item) => item.id),
      [3, 2, 1],
    );
    assert.equal(JSON.stringify(category).includes('password'), false);
  });

  it('trata % e _ do título como texto literal', async () => {
    const { service, wheres } = createListService(sample);
    const percent = await service.list({ title: '100%' });
    const underscore = await service.list({ title: '_' });

    assert.deepEqual(
      percent.data.map((item) => item.id),
      [4],
    );
    assert.deepEqual(
      underscore.data.map((item) => item.id),
      [6],
    );
    assert.equal(wheres[0]?.title?.contains, '100\\%');
    assert.equal(wheres[2]?.title?.contains, '\\_');
    assert.equal(wheres[0]?.title?.mode, 'insensitive');
  });

  it('inclui o dia inicial e o dia final inteiros em UTC', async () => {
    const { service, wheres } = createListService(sample);
    const from = await service.list({ from: '2026-09-30' });
    const to = await service.list({ to: '2026-09-30' });
    const period = await service.list({
      from: '2026-09-01',
      to: '2026-09-30',
    });

    assert.deepEqual(
      from.data.map((item) => item.id),
      [4, 3],
    );
    assert.ok(!to.data.some((item) => item.id === 4));
    assert.ok(to.data.some((item) => item.id === 3));
    assert.ok(period.data.some((item) => item.id === 1));
    assert.ok(period.data.some((item) => item.id === 3));
    assert.ok(!period.data.some((item) => item.id === 4));
    assert.equal(
      wheres.at(-1)?.createdAt?.gte?.toISOString(),
      '2026-09-01T00:00:00.000Z',
    );
    assert.equal(
      wheres.at(-1)?.createdAt?.lt?.toISOString(),
      '2026-10-01T00:00:00.000Z',
    );
  });

  it('combina os filtros antes de paginar e calcula o total filtrado', async () => {
    const { service, wheres } = createListService(sample);
    const categoryStatus = await service.list({
      category: 'TI',
      status: 'ABERTO',
    });
    const withTitle = await service.list({
      category: 'TI',
      status: 'ABERTO',
      title: 'cabo',
    });
    const withPeriod = await service.list({
      category: 'TI',
      status: 'ABERTO',
      from: '2026-09-10',
      to: '2026-09-10',
    });
    const all = await service.list({
      category: 'TI',
      status: 'ABERTO',
      title: 'cabo',
      from: '2026-09-01',
      to: '2026-09-30',
      page: 1,
      limit: 1,
    });

    assert.equal(categoryStatus.meta.total, 3);
    assert.notEqual(categoryStatus.meta.total, sample.length);
    assert.deepEqual(
      withTitle.data.map((item) => item.id),
      [7, 6],
    );
    assert.deepEqual(
      withPeriod.data.map((item) => item.id),
      [7, 6],
    );
    assert.deepEqual(
      all.data.map((item) => item.id),
      [7],
    );
    assert.equal(all.meta.total, 2);
    assert.equal(all.meta.totalPages, 2);
    assert.equal(wheres.at(-1)?.category, 'TI');
    assert.equal(wheres.at(-1)?.status, 'ABERTO');
    assert.deepEqual(wheres.at(-1), wheres.at(-2));
  });

  it('pagina com padrão 20, limite informado e página vazia', async () => {
    const rows = Array.from({ length: 5 }, (_, index) =>
      row(
        index + 1,
        `Pedido ${index + 1}`,
        'RH',
        'ABERTO',
        `2026-09-0${index + 1}T00:00:00.000Z`,
      ),
    );
    const { service } = createListService(rows);
    const defaults = await service.list({});
    const first = await service.list({ page: 1, limit: 2 });
    const second = await service.list({ page: 2, limit: 2 });
    const wide = await service.list({ limit: 100 });
    const empty = await service.list({ page: 4, limit: 2 });

    assert.equal(defaults.meta.page, 1);
    assert.equal(defaults.meta.limit, 20);
    assert.equal(defaults.meta.total, 5);
    assert.equal(defaults.meta.totalPages, 1);
    assert.deepEqual(
      first.data.map((item) => item.id),
      [5, 4],
    );
    assert.deepEqual(
      second.data.map((item) => item.id),
      [3, 2],
    );
    assert.equal(first.meta.totalPages, 3);
    assert.equal(wide.meta.limit, 100);
    assert.equal(wide.data.length, 5);
    assert.deepEqual(empty.data, []);
    assert.equal(empty.meta.total, 5);
    assert.equal(empty.meta.totalPages, 3);
  });

  it('calcula zero páginas quando o filtro não encontra nada', async () => {
    const { service } = createListService(sample);
    const result = await service.list({ category: 'FINANCEIRO' });

    assert.deepEqual(result.data, []);
    assert.deepEqual(result.meta, {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });
});
