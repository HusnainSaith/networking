import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TechnicianProfile } from './technician-profile.entity';

@Entity('technician_regions')
@Index(['technicianId', 'region'], { unique: true })
export class TechnicianRegion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId: string;

  @ManyToOne(() => TechnicianProfile, (technician) => technician.regions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'technician_id' })
  technician: TechnicianProfile;

  @Column({ length: 100 })
  region: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;
}
