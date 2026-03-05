// src/health/health.service.ts
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { AppResponse } from '../../common/responses/app-response';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  private readonly diskPath = process.platform === 'win32' ? 'C:' : '/';

  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  /**
   * Runs all of our health indicators and returns the Terminus result.
   */
  async checkHealth(): Promise<AppResponse<HealthCheckResult | null>> {
    const result = await this.health.check([
      async () => await this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      async () =>
        await this.disk.checkStorage('storage', {
          path: this.diskPath,
          thresholdPercent: 0.6,
        }),
      async () => await this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      async () => await this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);

    if (result.status === 'ok') {
      // Wrap the *entire* HealthCheckResult
      return AppResponse.Ok<HealthCheckResult>(result);
    } else {
      const payload = {
        message: 'Health check failed',
        details: result.details,
      };
      return AppResponse.Err(payload, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
