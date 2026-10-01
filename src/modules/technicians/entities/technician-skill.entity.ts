import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TechnicianProfile } from './technician-profile.entity';
import { Skill } from './skill.entity';

@Entity('technician_skills')
@Index(['technicianId', 'skillId'], { unique: true })
export class TechnicianSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId: string;

  @ManyToOne(() => TechnicianProfile, (technician) => technician.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'technician_id' })
  technician: TechnicianProfile;

  @Column({ name: 'skill_id', type: 'uuid' })
  skillId: string;

  @ManyToOne(() => Skill, (skill) => skill.technicians, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({ type: 'smallint', default: 1 })
  proficiency: number;

  @Column({
    name: 'years_experience',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  yearsExperience?: number;
}
