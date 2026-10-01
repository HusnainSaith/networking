import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../../common/modules/guards.module';

@Module({
  imports: [AuthModule, GuardsModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
