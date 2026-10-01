import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import {
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  PreferredTimeSlot,
} from '../../../common/enums/platform.enums';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerSite } from '../../customers/entities/customer-site.entity';
import { User } from '../../users/entities/user.entity';
import { ActivityAssignment } from './activity-assignment.entity';
import { ActivityStatusHistory } from './activity-status-history.entity';
import { ActivityAttachment } from './activity-attachment.entity';
import { ActivityNote } from './activity-note.entity';
import { CustomerSignature } from './customer-signature.entity';
import { CustomerFeedback } from '../../feedback/entities/customer-feedback.entity';

@Entity('activities')
@Index(['status', 'scheduledStart'])
@Index(['customerId', 'createdAt'])
export class Activity extends AuditableEntity {
  @Index({ unique: true })
  @Column({ name: 'reference_number', length: 32 })
  referenceNumber: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.activities, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId: string;

  @ManyToOne(() => CustomerSite, (site) => site.activities, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'site_id' })
  site: CustomerSite;

  @Column({ length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ActivityType, enumName: 'activity_type_enum' })
  type: ActivityType;

  @Index()
  @Column({
    type: 'enum',
    enum: ActivityPriority,
    enumName: 'activity_priority_enum',
    default: ActivityPriority.MEDIUM,
  })
  priority: ActivityPriority;

  @Index()
  @Column({
    type: 'enum',
    enum: ActivityStatus,
    enumName: 'activity_status_enum',
    default: ActivityStatus.UNASSIGNED,
  })
  status: ActivityStatus;

  @Column({ name: 'estimated_duration_minutes', type: 'smallint' })
  estimatedDurationMinutes: number;

  @Column({
    name: 'preferred_time_slot',
    type: 'enum',
    enum: PreferredTimeSlot,
    enumName: 'preferred_time_slot_enum',
    default: PreferredTimeSlot.FLEXIBLE,
  })
  preferredTimeSlot: PreferredTimeSlot;

  @Column({ name: 'preferred_date', type: 'date', nullable: true })
  preferredDate?: string;

  @Column({ name: 'preferred_start_time', type: 'time', nullable: true })
  preferredStartTime?: string;

  @Column({ name: 'preferred_end_time', type: 'time', nullable: true })
  preferredEndTime?: string;

  @Column({ name: 'scheduled_start', type: 'timestamptz', nullable: true })
  scheduledStart?: Date;

  @Column({ name: 'scheduled_end', type: 'timestamptz', nullable: true })
  scheduledEnd?: Date;

  @Column({ name: 'actual_start', type: 'timestamptz', nullable: true })
  actualStart?: Date;

  @Column({ name: 'actual_end', type: 'timestamptz', nullable: true })
  actualEnd?: Date;

  @Column({ name: 'equipment_required', type: 'text', nullable: true })
  equipmentRequired?: string;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes?: string;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @OneToMany(() => ActivityAssignment, (assignment) => assignment.activity)
  assignments: ActivityAssignment[];

  @OneToMany(() => ActivityStatusHistory, (history) => history.activity)
  statusHistory: ActivityStatusHistory[];

  @OneToMany(() => ActivityAttachment, (attachment) => attachment.activity)
  attachments: ActivityAttachment[];

  @OneToMany(() => ActivityNote, (note) => note.activity)
  notes: ActivityNote[];

  @OneToMany(() => CustomerSignature, (signature) => signature.activity)
  signatures: CustomerSignature[];

  @OneToMany(() => CustomerFeedback, (feedback) => feedback.activity)
  feedback: CustomerFeedback[];
}
