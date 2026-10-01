import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoutePlan } from './route-plan.entity';
import { Activity } from '../../activities/entities/activity.entity';

@Entity('route_stops')
@Index(['routePlanId', 'sequence'], { unique: true })
export class RouteStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_plan_id', type: 'uuid' })
  routePlanId: string;

  @ManyToOne(() => RoutePlan, (routePlan) => routePlan.stops, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'route_plan_id' })
  routePlan: RoutePlan;

  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ type: 'smallint' })
  sequence: number;

  @Column({ name: 'estimated_arrival_at', type: 'timestamptz', nullable: true })
  estimatedArrivalAt?: Date;

  @Column({
    name: 'estimated_departure_at',
    type: 'timestamptz',
    nullable: true,
  })
  estimatedDepartureAt?: Date;

  @Column({
    name: 'distance_from_previous_km',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  distanceFromPreviousKm?: number;

  @Column({
    name: 'travel_minutes_from_previous',
    type: 'smallint',
    nullable: true,
  })
  travelMinutesFromPrevious?: number;
}
