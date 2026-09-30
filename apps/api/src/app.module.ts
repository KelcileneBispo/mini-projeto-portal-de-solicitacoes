import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RequestsModule } from './requests/requests.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

@Module({
  imports: [PrismaModule, AuthModule, RequestsModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
