import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { DashboardSummary } from './dashboard-response.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getSummary(
    @Query() query: Record<string, unknown>,
  ): Promise<DashboardSummary> {
    return this.dashboardService.getSummary(query);
  }
}
