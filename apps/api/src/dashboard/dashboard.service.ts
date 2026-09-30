import { BadRequestException, Injectable } from '@nestjs/common';
import { RequestStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DashboardSummary } from './dashboard-response.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    query: Record<string, unknown> = {},
  ): Promise<DashboardSummary> {
    const fields = Object.keys(query);

    if (fields.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Dados inválidos',
        details: fields.map((field) => ({
          field,
          message: 'Campo não permitido',
        })),
      });
    }

    const groups = await this.prisma.client.request.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = new Map(
      groups.map((group) => [group.status, group._count._all]),
    );
    const open = counts.get(RequestStatus.ABERTO) ?? 0;
    const inProgress = counts.get(RequestStatus.EM_ATENDIMENTO) ?? 0;
    const completed = counts.get(RequestStatus.CONCLUIDO) ?? 0;

    return {
      total: open + inProgress + completed,
      open,
      inProgress,
      completed,
    };
  }
}
