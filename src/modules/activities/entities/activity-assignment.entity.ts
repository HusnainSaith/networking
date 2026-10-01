import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  AssignmentSource,
  AssignmentStatus,
} from '../../../common/enums/platform.enums';
import { Activity } from './activity.entity';
import { TechnicianProfile } from '../../technicians/entities/technician-profile.entity';
import { User } from '../../users/entities/user.entity';

@Entity('activity_assignments')
@Index(['activityId', 'technicianId', 'status'])
export class ActivityAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ManyToOne(() => Activity, (activity) => activity.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId: string;

  @ManyToOne(() => TechnicianProfile, (technician) => technician.assignments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'technician_id' })
  technician: TechnicianProfile;

  @Column({
    type: 'enum',
    enum: AssignmentSource,
    enumName: 'assignment_source_enum',
  })
  source: AssignmentSource;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    enumName: 'assignment_status_enum',
    default: AssignmentStatus.SUGGESTED,
  })
  status: AssignmentStatus;

  @Column({ type: 'smallint', nullable: true })
  rank?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column({
    name: 'distance_km',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  distanceKm?: number;

  @Column({ name: 'travel_time_minutes', type: 'smallint', nullable: true })
  travelTimeMinutes?: number;

  @Column({ name: 'available_at', type: 'timestamptz', nullable: true })
  availableAt?: Date;

  @Column({ name: 'estimated_arrival_at', type: 'timestamptz', nullable: true })
  estimatedArrivalAt?: Date;

  @Column({ name: 'scheduled_start', type: 'timestamptz', nullable: true })
  scheduledStart?: Date;

  @Column({ name: 'scheduled_end', type: 'timestamptz', nullable: true })
  scheduledEnd?: Date;

  @Column({ name: 'assigned_by_id', type: 'uuid', nullable: true })
  assignedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy?: User;

  @Column({ name: 'override_reason', type: 'text', nullable: true })
  overrideReason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
