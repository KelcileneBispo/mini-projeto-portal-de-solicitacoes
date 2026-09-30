import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import type { PublicUser } from '../auth/public-user.js';
import { RequestStatus } from '../../generated/prisma/enums.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CreateRequestDto } from './dto/create-request.dto.js';
import type { UpdateRequestDto } from './dto/update-request.dto.js';
import { RequestsService } from './requests.service.js';
import {
  DELETE_CLOSED_MESSAGE,
  DELETE_FORBIDDEN_MESSAGE,
  EDIT_CLOSED_MESSAGE,
  EDIT_FORBIDDEN_MESSAGE,
  INVALID_TRANSITION_MESSAGE,
  REQUEST_NOT_FOUND_MESSAGE,
} from './requests.errors.js';

const ana: PublicUser = { id: 1, name: 'Ana Souza', username: 'ana' };
const bruno: PublicUser = { id: 2, name: 'Bruno Lima', username: 'bruno' };

type StoredRequest = {
  id: number;
  title: string;
  description: string;
  category: 'TI' | 'RH' | 'COMPRAS' | 'FINANCEIRO' | 'INFRAESTRUTURA';
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
  requesterId: number;
  createdAt: Date;
  updatedAt: Date;
};

function requesterOf(id: number): PublicUser & { passwordHash: string } {
  const user = id === ana.id ? ana : bruno;
  return { ...user, passwordHash: 'hash-que-nao-pode-sair' };
}

function createService(initial: StoredRequest[]): {
  service: RequestsService;
  rows: StoredRequest[];
  created: Array<Record<string, unknown>>;
} {
  const rows = initial.map((row) => ({ ...row }));
  const created: Array<Record<string, unknown>> = [];
  let sequence = rows.reduce((max, row) => Math.max(max, row.id), 0);

  function project(
    row: StoredRequest,
    select: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(select)) {
      if (key === 'requester') {
        result.requester = requesterOf(row.requesterId);
        continue;
      }

      result[key] = row[key as keyof StoredRequest];
    }

    return result;
  }

  const client = {
    request: {
      create: async (args: {
        data: StoredRequest & { requesterId: number };
        select: Record<string, unknown>;
      }) => {
        created.push(args.data);
        sequence += 1;
        const now = new Date('2026-09-30T12:00:00.000Z');
        const row: StoredRequest = {
          id: sequence,
          title: args.data.title,
          description: args.data.description,
          category: args.data.category,
          status: args.data.status,
          requesterId: args.data.requesterId,
          createdAt: now,
          updatedAt: now,
        };
        rows.push(row);
        return project(row, args.select);
      },
      findUnique: async (args: {
        where: { id: number };
        select: Record<string, unknown>;
      }) => {
        const row = rows.find((item) => item.id === args.where.id);
        return row ? project(row, args.select) : null;
      },
      findMany: async (args: {
        select: Record<string, unknown>;
        skip?: number;
        take?: number;
      }) => {
        const ordered = [...rows].sort((left, right) => {
          const byDate = right.createdAt.getTime() - left.createdAt.getTime();
          return byDate === 0 ? right.id - left.id : byDate;
        });
        const start = args.skip ?? 0;
        const end = args.take === undefined ? undefined : start + args.take;

        return ordered
          .slice(start, end)
          .map((row) => project(row, args.select));
      },
      count: async () => rows.length,
      update: async (args: {
        where: { id: number };
        data: Partial<StoredRequest>;
        select: Record<string, unknown>;
      }) => {
        const row = rows.find((item) => item.id === args.where.id);
        assert.ok(row);
        Object.assign(row, args.data, {
          updatedAt: new Date('2026-09-30T13:00:00.000Z'),
        });
        return project(row, args.select);
      },
      delete: async (args: { where: { id: number } }) => {
        const index = rows.findIndex((item) => item.id === args.where.id);
        assert.notEqual(index, -1);
        rows.splice(index, 1);
      },
    },
    $transaction: async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
  };

  const service = new RequestsService({ client } as unknown as PrismaService);
  return { service, rows, created };
}

function openRequest(id: number, requesterId: number): StoredRequest {
  return {
    id,
    title: `Pedido ${id}`,
    description: 'Descrição longa o bastante para o pedido.',
    category: 'TI',
    status: 'ABERTO',
    requesterId,
    createdAt: new Date(`2026-09-2${id}T12:00:00.000Z`),
    updatedAt: new Date(`2026-09-2${id}T12:00:00.000Z`),
  };
}

function httpError(error: unknown): HttpException {
  assert.ok(error instanceof HttpException);
  return error;
}

describe('RequestsService', () => {
  const draft: CreateRequestDto = {
    title: 'Acesso à VPN',
    description: 'Preciso de acesso à VPN para o trabalho remoto.',
    category: 'TI',
  };

  it('cria a solicitação aberta para o usuário autenticado', async () => {
    const { service, created } = createService([]);
    const result = await service.create(ana, draft);

    assert.equal(result.status, RequestStatus.ABERTO);
    assert.equal(created[0]?.requesterId, ana.id);
    assert.equal('requesterId' in result, false);
    assert.deepEqual(result.requester, ana);
    assert.equal(JSON.stringify(result).includes('password'), false);
    assert.equal(created[0]?.status, RequestStatus.ABERTO);
  });

  it('edita somente o autor enquanto a solicitação está aberta', async () => {
    const { service, rows } = createService([openRequest(4, ana.id)]);
    const updated = await service.update(ana, 4, {
      title: 'Acesso à VPN corporativa',
    });

    assert.equal(updated.title, 'Acesso à VPN corporativa');
    assert.equal(updated.status, RequestStatus.ABERTO);
    assert.equal(updated.requester.id, ana.id);
    assert.equal(rows[0]?.title, 'Acesso à VPN corporativa');
    assert.equal(JSON.stringify(updated).includes('password'), false);
  });

  it('recusa edição e exclusão de outro usuário antes da regra de status', async () => {
    const closed = openRequest(7, ana.id);
    closed.status = 'CONCLUIDO';
    const { service, rows } = createService([openRequest(5, ana.id), closed]);

    const edit = await service
      .update(bruno, 5, { title: 'Título alterado' })
      .then(
        () => null,
        (error: unknown) => httpError(error),
      );
    const remove = await service.remove(bruno, 7).then(
      () => null,
      (error: unknown) => httpError(error),
    );

    assert.ok(edit instanceof ForbiddenException);
    assert.equal(edit.message, EDIT_FORBIDDEN_MESSAGE);
    assert.ok(remove instanceof ForbiddenException);
    assert.equal(remove.message, DELETE_FORBIDDEN_MESSAGE);
    assert.equal(rows.length, 2);
  });

  it('recusa edição e exclusão depois que a solicitação sai de aberto', async () => {
    const progress = openRequest(8, ana.id);
    progress.status = 'EM_ATENDIMENTO';
    const done = openRequest(9, ana.id);
    done.status = 'CONCLUIDO';
    const { service, rows } = createService([progress, done]);

    const edit = await service
      .update(ana, 8, { description: 'Nova descrição com tamanho válido.' })
      .then(
        () => null,
        (error: unknown) => httpError(error),
      );
    const remove = await service.remove(ana, 9).then(
      () => null,
      (error: unknown) => httpError(error),
    );

    assert.ok(edit instanceof ConflictException);
    assert.equal(edit.message, EDIT_CLOSED_MESSAGE);
    assert.ok(remove instanceof ConflictException);
    assert.equal(remove.message, DELETE_CLOSED_MESSAGE);
    assert.equal(rows.length, 2);
  });

  it('exclui fisicamente a solicitação aberta do autor', async () => {
    const { service, rows } = createService([openRequest(6, ana.id)]);

    await service.remove(ana, 6);

    assert.equal(rows.length, 0);
  });

  it('aceita apenas a próxima etapa de status', async () => {
    const open = openRequest(10, ana.id);
    const progress = openRequest(11, bruno.id);
    progress.status = 'EM_ATENDIMENTO';
    const { service } = createService([open, progress]);

    const inProgress = await service.updateStatus(10, {
      status: RequestStatus.EM_ATENDIMENTO,
    });
    const completed = await service.updateStatus(11, {
      status: RequestStatus.CONCLUIDO,
    });

    assert.equal(inProgress.status, RequestStatus.EM_ATENDIMENTO);
    assert.equal(inProgress.title, open.title);
    assert.equal(completed.status, RequestStatus.CONCLUIDO);
    assert.equal(completed.requester.id, bruno.id);
  });

  it('bloqueia pular etapa, voltar e sair de concluído', async () => {
    const open = openRequest(12, ana.id);
    const done = openRequest(13, ana.id);
    done.status = 'CONCLUIDO';
    const progress = openRequest(14, ana.id);
    progress.status = 'EM_ATENDIMENTO';
    const { service, rows } = createService([open, done, progress]);

    for (const attempt of [
      service.updateStatus(12, { status: RequestStatus.CONCLUIDO }),
      service.updateStatus(13, { status: RequestStatus.ABERTO }),
      service.updateStatus(14, { status: RequestStatus.ABERTO }),
    ]) {
      const error = await attempt.then(
        () => null,
        (caught: unknown) => httpError(caught),
      );
      assert.ok(error instanceof ConflictException);
      assert.equal(error.message, INVALID_TRANSITION_MESSAGE);
    }

    assert.equal(rows.find((row) => row.id === 12)?.status, 'ABERTO');
    assert.equal(rows.find((row) => row.id === 13)?.status, 'CONCLUIDO');
    assert.equal(rows.find((row) => row.id === 14)?.status, 'EM_ATENDIMENTO');
  });

  it('responde 404 quando a solicitação não existe', async () => {
    const { service } = createService([]);
    const missing: UpdateRequestDto = { title: 'Pedido inexistente' };

    for (const attempt of [
      service.findOne(99),
      service.update(ana, 99, missing),
      service.remove(ana, 99),
      service.updateStatus(99, { status: RequestStatus.EM_ATENDIMENTO }),
    ]) {
      const error = await attempt.then(
        () => null,
        (caught: unknown) => httpError(caught),
      );
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, REQUEST_NOT_FOUND_MESSAGE);
    }
  });

  it('lista todas as solicitações sem a descrição e sem o hash', async () => {
    const older = openRequest(1, ana.id);
    const newer = openRequest(2, bruno.id);
    newer.createdAt = new Date('2026-09-30T12:00:00.000Z');
    const { service } = createService([older, newer]);
    const result = await service.list({ page: 1, limit: 20 });

    assert.deepEqual(
      result.data.map((item) => item.id),
      [2, 1],
    );
    assert.deepEqual(result.meta, {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
    assert.equal('description' in result.data[0], false);
    assert.equal(JSON.stringify(result).includes('password'), false);
  });
});
