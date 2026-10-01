import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import {
  NotificationChannel,
  NotificationStatus,
} from '../../../common/enums/platform.enums';
import { Activity } from '../../activities/entities/activity.entity';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
@Index(['status', 'scheduledAt'])
export class Notification extends AuditableEntity {
  @Column({ name: 'activity_id', type: 'uuid', nullable: true })
  activityId?: string;

  @ManyToOne(() => Activity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity?: Activity;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    enumName: 'notification_channel_enum',
  })
  channel: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    enumName: 'notification_status_enum',
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ length: 255 })
  recipient: string;

  @Column({ length: 180, nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'provider_message_id', length: 255, nullable: true })
  providerMessageId?: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;
}
