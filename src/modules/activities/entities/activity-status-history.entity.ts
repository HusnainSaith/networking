import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActivityStatus } from '../../../common/enums/platform.enums';
import { Activity } from './activity.entity';
import { User } from '../../users/entities/user.entity';

@Entity('activity_status_history')
@Index(['activityId', 'createdAt'])
export class ActivityStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ManyToOne(() => Activity, (activity) => activity.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: ActivityStatus,
    enumName: 'activity_status_enum',
    nullable: true,
  })
  fromStatus?: ActivityStatus;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: ActivityStatus,
    enumName: 'activity_status_enum',
  })
  toStatus: ActivityStatus;

  @Column({ name: 'changed_by_id', type: 'uuid', nullable: true })
  changedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy?: User;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
