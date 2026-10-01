import { Column, Entity, Index, OneToMany } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { CustomerSite } from './customer-site.entity';
import { Activity } from '../../activities/entities/activity.entity';

@Entity('customers')
export class Customer extends AuditableEntity {
  @Index()
  @Column({ name: 'company_name', length: 160 })
  companyName: string;

  @Index({ unique: true })
  @Column({ name: 'vat_number', length: 32 })
  vatNumber: string;

  @Column({ name: 'contact_person', length: 120 })
  contactPerson: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 32 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => CustomerSite, (site) => site.customer)
  sites: CustomerSite[];

  @OneToMany(() => Activity, (activity) => activity.customer)
  activities: Activity[];
}
