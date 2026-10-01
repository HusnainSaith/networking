import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RoutingService } from './routing.service';
import { SafeLogger } from '../../common/utils/logger.util';

@Injectable()
export class RoutingScheduler {
  constructor(private readonly routingService: RoutingService) {}

  @Cron('0 6 * * *', {
    name: 'morning-route-optimization',
    timeZone: 'Europe/Rome',
  })
  async optimizeMorningRoutes(): Promise<void> {
    const routeDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    try {
      const count = await this.routingService.optimizeAllForDate(routeDate);
      SafeLogger.log(
        `Optimized ${count} technician routes`,
        'RoutingScheduler',
      );
    } catch (error) {
      SafeLogger.error(
        error instanceof Error ? error.message : 'Route optimization failed',
        'RoutingScheduler',
      );
    }
  }
}
