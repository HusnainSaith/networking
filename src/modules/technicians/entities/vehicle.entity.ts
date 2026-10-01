import { Column, Entity, Index, OneToMany } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { TechnicianProfile } from './technician-profile.entity';

@Entity('vehicles')
export class Vehicle extends AuditableEntity {
  @Index({ unique: true })
  @Column({ name: 'registration_number', length: 32 })
  registrationNumber: string;

  @Column({ length: 80 })
  make: string;

  @Column({ length: 80 })
  model: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => TechnicianProfile, (technician) => technician.vehicle)
  technicians: TechnicianProfile[];
}
