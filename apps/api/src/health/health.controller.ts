import { Controller } from '@nestjs/common';
import { DiskHealthIndicator, HealthCheckService } from '@nestjs/terminus';
import { Implement, implement } from '@orpc/nest';

import { contract } from '@spacedb/contract';

import { DatabaseHealthIndicator } from './database.health';

@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Implement(contract.health.ping)
  ping() {
    return implement(contract.health.ping).handler(({ context }) => ({
      ok: true as const,
      ts: Date.now(),
      correlationId: context.correlationId,
    }));
  }

  @Implement(contract.health.liveness)
  liveness() {
    return implement(contract.health.liveness).handler(() =>
      this.health.check([]),
    );
  }

  @Implement(contract.health.readiness)
  readiness() {
    return implement(contract.health.readiness).handler(() =>
      this.health.check([
        () =>
          this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
        () => this.database.pingCheck(),
      ]),
    );
  }

  @Implement(contract.health.check)
  check() {
    return implement(contract.health.check).handler(() =>
      this.health.check([
        () =>
          this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.99 }),
        () => this.database.pingCheck(),
      ]),
    );
  }
}
