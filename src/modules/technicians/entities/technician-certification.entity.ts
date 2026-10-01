import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TechnicianProfile } from './technician-profile.entity';
import { Certification } from './certification.entity';

@Entity('technician_certifications')
@Index(['technicianId', 'certificationId'], { unique: true })
export class TechnicianCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId: string;

  @ManyToOne(
    () => TechnicianProfile,
    (technician) => technician.certifications,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'technician_id' })
  technician: TechnicianProfile;

  @Column({ name: 'certification_id', type: 'uuid' })
  certificationId: string;

  @ManyToOne(
    () => Certification,
    (certification) => certification.technicians,
    { onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'certification_id' })
  certification: Certification;

  @Column({ name: 'certificate_number', length: 100, nullable: true })
  certificateNumber?: string;

  @Column({ name: 'issued_at', type: 'date', nullable: true })
  issuedAt?: string;

  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt?: string;
}
