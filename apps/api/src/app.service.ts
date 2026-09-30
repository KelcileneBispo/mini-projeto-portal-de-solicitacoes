import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@portal/types';

@Injectable()
export class AppService {
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
