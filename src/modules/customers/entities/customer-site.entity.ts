import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { SiteType } from '../../../common/enums/platform.enums';
import { Customer } from './customer.entity';
import { Activity } from '../../activities/entities/activity.entity';

@Entity('customer_sites')
@Index(['customerId', 'name'], { unique: true })
@Index(['latitude', 'longitude'])
export class CustomerSite extends AuditableEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.sites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ length: 120, default: 'Main site' })
  name: string;

  @Column({
    name: 'site_type',
    type: 'enum',
    enum: SiteType,
    enumName: 'site_type_enum',
    default: SiteType.OTHER,
  })
  siteType: SiteType;

  @Column({ name: 'address_line_1', length: 180 })
  addressLine1: string;

  @Column({ name: 'address_line_2', length: 180, nullable: true })
  addressLine2?: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  province: string;

  @Column({ length: 100 })
  region: string;

  @Column({ name: 'postal_code', length: 16 })
  postalCode: string;

  @Column({ length: 2, default: 'IT' })
  country: string;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  longitude: number;

  @Column({ name: 'contact_person', length: 120, nullable: true })
  contactPerson?: string;

  @Column({ name: 'contact_phone', length: 32, nullable: true })
  contactPhone?: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @OneToMany(() => Activity, (activity) => activity.site)
  activities: Activity[];
}
