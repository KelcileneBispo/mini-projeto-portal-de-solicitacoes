import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { PublicUser } from '../auth/public-user.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto.js';
import { UpdateRequestDto } from './dto/update-request.dto.js';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto.js';
import { RequestIdPipe } from './request-id.pipe.js';
import type { RequestDetail, RequestList } from './request-response.js';
import { RequestsService } from './requests.service.js';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateRequestDto,
  ): Promise<RequestDetail> {
    return this.requestsService.create(user, dto);
  }

  @Get()
  list(@Query() query: ListRequestsQueryDto): Promise<RequestList> {
    return this.requestsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', RequestIdPipe) id: number): Promise<RequestDetail> {
    return this.requestsService.findOne(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', RequestIdPipe) id: number,
    @Body() dto: UpdateRequestDto,
  ): Promise<RequestDetail> {
    return this.requestsService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: PublicUser,
    @Param('id', RequestIdPipe) id: number,
  ): Promise<void> {
    return this.requestsService.remove(user, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', RequestIdPipe) id: number,
    @Body() dto: UpdateRequestStatusDto,
  ): Promise<RequestDetail> {
    return this.requestsService.updateStatus(id, dto);
  }
}
