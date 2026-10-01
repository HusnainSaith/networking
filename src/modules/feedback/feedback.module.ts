import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerFeedback } from './entities/customer-feedback.entity';
import { Activity } from '../activities/entities/activity.entity';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../../common/modules/guards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerFeedback, Activity]),
    AuthModule,
    GuardsModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
