import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { PublicUser } from '../auth/public-user.js';
import {
  RequestStatus,
  type RequestCategory,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { CreateRequestDto } from './dto/create-request.dto.js';
import type { ListRequestsQueryDto } from './dto/list-requests-query.dto.js';
import type { UpdateRequestDto } from './dto/update-request.dto.js';
import type { UpdateRequestStatusDto } from './dto/update-request-status.dto.js';
import type {
  RequestDetail,
  RequestList,
  RequestListItem,
} from './request-response.js';
import {
  DELETE_CLOSED_MESSAGE,
  DELETE_FORBIDDEN_MESSAGE,
  EDIT_CLOSED_MESSAGE,
  EDIT_FORBIDDEN_MESSAGE,
  EMPTY_UPDATE_MESSAGE,
  INVALID_TRANSITION_MESSAGE,
  REQUEST_NOT_FOUND_MESSAGE,
  invalidData,
} from './requests.errors.js';
import { nextUtcDay, parseUtcDay } from './utc-day.js';

const requesterSelect = {
  id: true,
  name: true,
  username: true,
} as const;

const detailSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  requester: { select: requesterSelect },
} as const;

const listSelect = {
  id: true,
  title: true,
  category: true,
  status: true,
  createdAt: true,
  requester: { select: requesterSelect },
} as const;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

type ChangeTarget = {
  id: number;
  requesterId: number;
  status: RequestStatus;
};

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: PublicUser,
    dto: CreateRequestDto,
  ): Promise<RequestDetail> {
    const created = await this.prisma.client.request.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        status: RequestStatus.ABERTO,
        requesterId: user.id,
      },
      select: detailSelect,
    });

    return toDetail(created);
  }

  async list(query: ListRequestsQueryDto): Promise<RequestList> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const where = requestWhere(query);
    const [total, rows] = await this.prisma.client.$transaction([
      this.prisma.client.request.count({ where }),
      this.prisma.client.request.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: listSelect,
      }),
    ]);

    return {
      data: rows.map((row) => toListItem(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<RequestDetail> {
    const request = await this.prisma.client.request.findUnique({
      where: { id },
      select: detailSelect,
    });

    if (!request) {
      throw new NotFoundException(REQUEST_NOT_FOUND_MESSAGE);
    }

    return toDetail(request);
  }

  async update(
    user: PublicUser,
    id: number,
    dto: UpdateRequestDto,
  ): Promise<RequestDetail> {
    const data = editableData(dto);
    const current = await this.loadForChange(id);
    this.assertAuthor(current, user.id, EDIT_FORBIDDEN_MESSAGE);
    this.assertOpen(current.status, EDIT_CLOSED_MESSAGE);

    const updated = await this.prisma.client.request.update({
      where: { id },
      data,
      select: detailSelect,
    });

    return toDetail(updated);
  }

  async remove(user: PublicUser, id: number): Promise<void> {
    const current = await this.loadForChange(id);
    this.assertAuthor(current, user.id, DELETE_FORBIDDEN_MESSAGE);
    this.assertOpen(current.status, DELETE_CLOSED_MESSAGE);

    await this.prisma.client.request.delete({ where: { id } });
  }

  async updateStatus(
    id: number,
    dto: UpdateRequestStatusDto,
  ): Promise<RequestDetail> {
    const current = await this.loadForChange(id);

    if (dto.status !== nextStatus(current.status)) {
      throw new ConflictException(INVALID_TRANSITION_MESSAGE);
    }

    const updated = await this.prisma.client.request.update({
      where: { id },
      data: { status: dto.status },
      select: detailSelect,
    });

    return toDetail(updated);
  }

  private async loadForChange(id: number): Promise<ChangeTarget> {
    const request = await this.prisma.client.request.findUnique({
      where: { id },
      select: {
        id: true,
        requesterId: true,
        status: true,
      },
    });

    if (!request) {
      throw new NotFoundException(REQUEST_NOT_FOUND_MESSAGE);
    }

    return request;
  }

  private assertAuthor(
    request: ChangeTarget,
    userId: number,
    message: string,
  ): void {
    if (request.requesterId !== userId) {
      throw new ForbiddenException(message);
    }
  }

  private assertOpen(status: RequestStatus, message: string): void {
    if (status !== RequestStatus.ABERTO) {
      throw new ConflictException(message);
    }
  }
}

function requestWhere(query: ListRequestsQueryDto): Prisma.RequestWhereInput {
  const where: Prisma.RequestWhereInput = {};

  if (query.category) {
    where.category = query.category;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.title) {
    where.title = {
      contains: escapeLike(query.title),
      mode: 'insensitive',
    };
  }

  const createdAt: Prisma.DateTimeFilter = {};

  if (query.from) {
    const start = parseUtcDay(query.from);

    if (!start) {
      throw invalidData('from', 'Data deve estar no formato YYYY-MM-DD');
    }

    createdAt.gte = start;
  }

  if (query.to) {
    const end = parseUtcDay(query.to);

    if (!end) {
      throw invalidData('to', 'Data deve estar no formato YYYY-MM-DD');
    }

    createdAt.lt = nextUtcDay(end);
  }

  if (query.from && query.to && createdAt.gte && createdAt.lt) {
    const start = createdAt.gte;
    const end = query.to ? parseUtcDay(query.to) : null;

    if (start instanceof Date && end && start.getTime() > end.getTime()) {
      throw invalidData(
        'to',
        'A data inicial não pode ser posterior à data final',
      );
    }
  }

  if (query.from || query.to) {
    where.createdAt = createdAt;
  }

  return where;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function editableData(dto: UpdateRequestDto): {
  title?: string;
  description?: string;
  category?: RequestCategory;
} {
  const data: {
    title?: string;
    description?: string;
    category?: RequestCategory;
  } = {};

  if (dto.title !== undefined) {
    data.title = dto.title;
  }

  if (dto.description !== undefined) {
    data.description = dto.description;
  }

  if (dto.category !== undefined) {
    data.category = dto.category;
  }

  if (Object.keys(data).length === 0) {
    throw invalidData('body', EMPTY_UPDATE_MESSAGE);
  }

  return data;
}

function nextStatus(status: RequestStatus): RequestStatus | null {
  if (status === RequestStatus.ABERTO) {
    return RequestStatus.EM_ATENDIMENTO;
  }

  if (status === RequestStatus.EM_ATENDIMENTO) {
    return RequestStatus.CONCLUIDO;
  }

  return null;
}

function toPublicUser(user: {
  id: number;
  name: string;
  username: string;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
  };
}

function toDetail(row: {
  id: number;
  title: string;
  description: string;
  category: RequestCategory;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  requester: { id: number; name: string; username: string };
}): RequestDetail {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    requester: toPublicUser(row.requester),
  };
}

function toListItem(row: {
  id: number;
  title: string;
  category: RequestCategory;
  status: RequestStatus;
  createdAt: Date;
  requester: { id: number; name: string; username: string };
}): RequestListItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt,
    requester: toPublicUser(row.requester),
  };
}
