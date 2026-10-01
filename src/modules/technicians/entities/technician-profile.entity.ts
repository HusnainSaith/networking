import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { TechnicianStatus } from '../../../common/enums/platform.enums';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from './vehicle.entity';
import { TechnicianSkill } from './technician-skill.entity';
import { TechnicianCertification } from './technician-certification.entity';
import { TechnicianRegion } from './technician-region.entity';
import { ActivityAssignment } from '../../activities/entities/activity-assignment.entity';
import { TechnicianLocation } from '../../tracking/entities/technician-location.entity';

@Entity('technician_profiles')
export class TechnicianProfile extends AuditableEntity {
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'first_name', length: 80 })
  firstName: string;

  @Column({ name: 'last_name', length: 80 })
  lastName: string;

  @Column({ length: 32 })
  phone: string;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId?: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.technicians, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @Index()
  @Column({
    type: 'enum',
    enum: TechnicianStatus,
    enumName: 'technician_status_enum',
    default: TechnicianStatus.OFFLINE,
  })
  status: TechnicianStatus;

  @Column({ name: 'max_daily_minutes', type: 'smallint', default: 480 })
  maxDailyMinutes: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => TechnicianSkill, (item) => item.technician)
  skills: TechnicianSkill[];

  @OneToMany(() => TechnicianCertification, (item) => item.technician)
  certifications: TechnicianCertification[];

  @OneToMany(() => TechnicianRegion, (item) => item.technician)
  regions: TechnicianRegion[];

  @OneToMany(() => ActivityAssignment, (assignment) => assignment.technician)
  assignments: ActivityAssignment[];

  @OneToMany(() => TechnicianLocation, (location) => location.technician)
  locations: TechnicianLocation[];
}
