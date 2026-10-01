import { Column, Entity, Index, OneToMany } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { TechnicianCertification } from './technician-certification.entity';

@Entity('certifications')
export class Certification extends AuditableEntity {
  @Index({ unique: true })
  @Column({ length: 120 })
  name: string;

  @Column({ length: 120, nullable: true })
  issuer?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => TechnicianCertification, (item) => item.certification)
  technicians: TechnicianCertification[];
}
