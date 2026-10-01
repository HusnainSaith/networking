import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TechnicianProfile } from '../../technicians/entities/technician-profile.entity';

@Entity('technician_locations')
@Index(['technicianId', 'recordedAt'])
@Index(['recordedAt'])
export class TechnicianLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId: string;

  @ManyToOne(() => TechnicianProfile, (technician) => technician.locations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'technician_id' })
  technician: TechnicianProfile;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  longitude: number;

  @Column({
    name: 'accuracy_meters',
    type: 'decimal',
    precision: 7,
    scale: 2,
    nullable: true,
  })
  accuracyMeters?: number;

  @Column({
    name: 'speed_kph',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  speedKph?: number;

  @Column({
    name: 'heading_degrees',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  headingDegrees?: number;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;

  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;
}
