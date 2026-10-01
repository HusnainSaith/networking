import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { TechnicianProfile } from '../../technicians/entities/technician-profile.entity';
import { RouteStop } from './route-stop.entity';

@Entity('route_plans')
@Index(['technicianId', 'routeDate'], { unique: true })
export class RoutePlan extends AuditableEntity {
  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId: string;

  @ManyToOne(() => TechnicianProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'technician_id' })
  technician: TechnicianProfile;

  @Column({ name: 'route_date', type: 'date' })
  routeDate: string;

  @Column({ name: 'provider', length: 40, nullable: true })
  provider?: string;

  @Column({
    name: 'total_distance_km',
    type: 'decimal',
    precision: 9,
    scale: 2,
    nullable: true,
  })
  totalDistanceKm?: number;

  @Column({ name: 'total_travel_minutes', type: 'integer', nullable: true })
  totalTravelMinutes?: number;

  @Column({ name: 'optimized_at', type: 'timestamptz', nullable: true })
  optimizedAt?: Date;

  @Column({ name: 'optimization_metadata', type: 'jsonb', nullable: true })
  optimizationMetadata?: Record<string, unknown>;

  @OneToMany(() => RouteStop, (stop) => stop.routePlan)
  stops: RouteStop[];
}
