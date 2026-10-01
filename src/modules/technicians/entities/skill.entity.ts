import { Column, Entity, Index, OneToMany } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { TechnicianSkill } from './technician-skill.entity';

@Entity('skills')
export class Skill extends AuditableEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => TechnicianSkill, (technicianSkill) => technicianSkill.skill)
  technicians: TechnicianSkill[];
}
