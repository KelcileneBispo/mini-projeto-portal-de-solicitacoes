import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
