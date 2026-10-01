import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutePlan } from './entities/route-plan.entity';
import { RouteStop } from './entities/route-stop.entity';
import { Activity } from '../activities/entities/activity.entity';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity';
import { RoutingService } from './routing.service';
import { RoutingController } from './routing.controller';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../../common/modules/guards.module';
import { RoutingScheduler } from './routing.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoutePlan,
      RouteStop,
      Activity,
      TechnicianProfile,
    ]),
    AuthModule,
    GuardsModule,
  ],
  controllers: [RoutingController],
  providers: [RoutingService, RoutingScheduler],
  exports: [RoutingService],
})
export class RoutingModule {}
