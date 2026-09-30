import 'reflect-metadata';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

describe('dashboard', () => {
  it('soma os status e trata ausência como zero', async () => {
    const populated = serviceFrom([
      ['ABERTO', 2],
      ['EM_ATENDIMENTO', 2],
      ['CONCLUIDO', 2],
    ]);
    const partial = serviceFrom([['ABERTO', 4]]);
    const empty = serviceFrom([]);

    assert.deepEqual(await populated.getSummary(), {
      total: 6,
      open: 2,
      inProgress: 2,
      completed: 2,
    });
    assert.deepEqual(await partial.getSummary(), {
      total: 4,
      open: 4,
      inProgress: 0,
      completed: 0,
    });
    assert.deepEqual(await empty.getSummary(), {
      total: 0,
      open: 0,
      inProgress: 0,
      completed: 0,
    });
  });

  it('exige JWT e não aceita filtro na query', async () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      DashboardController,
    ) as unknown[];
    const service = serviceFrom([]);

    assert.equal(guards.includes(JwtAuthGuard), true);
    assert.deepEqual(await service.getSummary({}), {
      total: 0,
      open: 0,
      inProgress: 0,
      completed: 0,
    });
    await assert.rejects(
      service.getSummary({ status: 'ABERTO' }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        const body = error.getResponse() as {
          statusCode: number;
          details: Array<{ field: string }>;
        };
        assert.equal(body.statusCode, 400);
        assert.equal(body.details[0]?.field, 'status');
        return true;
      },
    );
  });
});

function serviceFrom(groups: Array<[string, number]>): DashboardService {
  const client = {
    request: {
      groupBy: async () =>
        groups.map(([status, count]) => ({
          status,
          _count: { _all: count },
        })),
    },
  };

  return new DashboardService({ client } as unknown as PrismaService);
}
