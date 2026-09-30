import 'reflect-metadata';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';
import { RequestsController } from './requests.controller.js';

describe('solicitações protegidas', () => {
  it('exige JWT no controller', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      RequestsController,
    ) as unknown[];

    assert.equal(guards.includes(JwtAuthGuard), true);
  });

  it('recusa título curto e categoria fora do enum', async () => {
    const dto = plainToInstance(CreateRequestDto, {
      title: ' ab ',
      description: '  curta  ',
      category: 'OUTRA',
    });
    const errors = await validate(dto);
    const fields = errors.map((error) => error.property).sort();

    assert.deepEqual(fields, ['category', 'description', 'title']);
  });

  it('aceita edição parcial e normaliza o título', async () => {
    const dto = plainToInstance(UpdateRequestDto, {
      title: '  Acesso à VPN corporativa  ',
    });
    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.title, 'Acesso à VPN corporativa');
  });
});
