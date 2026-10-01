import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicianLocation } from './entities/technician-location.entity';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../../common/modules/guards.module';
import { TrackingGateway } from './tracking.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([TechnicianLocation, TechnicianProfile]),
    AuthModule,
    GuardsModule,
  ],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingService],
})
export class TrackingModule {}
