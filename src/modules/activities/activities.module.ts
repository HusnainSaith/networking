import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityAssignment } from './entities/activity-assignment.entity';
import { ActivityStatusHistory } from './entities/activity-status-history.entity';
import { ActivityAttachment } from './entities/activity-attachment.entity';
import { ActivityNote } from './entities/activity-note.entity';
import { CustomerSignature } from './entities/customer-signature.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerSite } from '../customers/entities/customer-site.entity';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity';
import { TechnicianLocation } from '../tracking/entities/technician-location.entity';
import { User } from '../users/entities/user.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../../common/modules/guards.module';
import { FileStorageService } from '../../common/services/file-storage.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityAssignment,
      ActivityStatusHistory,
      ActivityAttachment,
      ActivityNote,
      CustomerSignature,
      Customer,
      CustomerSite,
      TechnicianProfile,
      TechnicianLocation,
      User,
    ]),
    AuthModule,
    GuardsModule,
    NotificationsModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, FileStorageService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
