import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ServiceResponse } from '../../common/interfaces/service-response.interface';
import { Activity } from '../activities/entities/activity.entity';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity';
import { CreateRoutePlanDto } from './dto/create-route-plan.dto';
import { RoutePlan } from './entities/route-plan.entity';
import { RouteStop } from './entities/route-stop.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RoutingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(RoutePlan) private readonly plans: Repository<RoutePlan>,
    @InjectRepository(Activity)
    private readonly activities: Repository<Activity>,
    @InjectRepository(TechnicianProfile)
    private readonly technicians: Repository<TechnicianProfile>,
  ) {}

  async optimize(dto: CreateRoutePlanDto): Promise<ServiceResponse<RoutePlan>> {
    if (
      !(await this.technicians.exist({
        where: { id: dto.technicianId, isActive: true },
      }))
    )
      throw new NotFoundException('Active technician not found');
    const activities = await this.activities.find({
      where: { id: In(dto.activityIds) },
      relations: { site: true },
    });
    if (activities.length !== dto.activityIds.length)
      throw new NotFoundException('One or more activities were not found');
    if (activities.some((activity) => !activity.site))
      throw new BadRequestException(
        'Every activity must have a geocoded customer site',
      );
    const ordered = this.nearestNeighbor(activities);
    const routeMetrics = await this.getRouteMetrics(ordered);
    const data = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(RoutePlan, {
        where: { technicianId: dto.technicianId, routeDate: dto.routeDate },
      });
      if (existing) await manager.remove(RoutePlan, existing);
      const plan = await manager.save(
        RoutePlan,
        manager.create(RoutePlan, {
          technicianId: dto.technicianId,
          routeDate: dto.routeDate,
          provider: routeMetrics.provider,
          totalDistanceKm: routeMetrics.totalDistanceKm,
          totalTravelMinutes: routeMetrics.totalTravelMinutes,
          optimizedAt: new Date(),
          optimizationMetadata: {
            algorithm: 'nearest_neighbor',
            externalTrafficApplied: routeMetrics.trafficApplied,
          },
        }),
      );
      const stops = ordered.map((activity, index) =>
        manager.create(RouteStop, {
          routePlanId: plan.id,
          activityId: activity.id,
          sequence: index + 1,
          estimatedArrivalAt: activity.scheduledStart,
          estimatedDepartureAt: activity.scheduledEnd,
          distanceFromPreviousKm: routeMetrics.legs[index]?.distanceKm,
          travelMinutesFromPrevious: routeMetrics.legs[index]?.durationMinutes,
        }),
      );
      await manager.save(RouteStop, stops);
      return plan;
    });
    return this.findOne(data.id, 'Route optimized successfully');
  }

  async findOne(
    id: string,
    message = 'Route plan retrieved successfully',
  ): Promise<ServiceResponse<RoutePlan>> {
    const data = await this.plans.findOne({
      where: { id },
      relations: {
        technician: true,
        stops: { activity: { site: true, customer: true } },
      },
      order: { stops: { sequence: 'ASC' } },
    });
    if (!data) throw new NotFoundException('Route plan not found');
    return { success: true, message, data };
  }

  async findByTechnician(
    technicianId: string,
    routeDate: string,
  ): Promise<ServiceResponse<RoutePlan>> {
    const data = await this.plans.findOne({
      where: { technicianId, routeDate },
      relations: {
        technician: true,
        stops: { activity: { site: true, customer: true } },
      },
      order: { stops: { sequence: 'ASC' } },
    });
    if (!data) throw new NotFoundException('Route plan not found');
    return {
      success: true,
      message: 'Route plan retrieved successfully',
      data,
    };
  }

  async optimizeAllForDate(routeDate: string): Promise<number> {
    const rows: Array<{ technician_id: string; activity_ids: string[] }> =
      await this.dataSource.query(
        `SELECT aa.technician_id, ARRAY_AGG(a.id ORDER BY a.scheduled_start) AS activity_ids
         FROM activity_assignments aa
         JOIN activities a ON a.id = aa.activity_id
         WHERE aa.status IN ('assigned','accepted') AND a.scheduled_start::date = $1::date
         GROUP BY aa.technician_id`,
        [routeDate],
      );
    for (const row of rows) {
      await this.optimize({
        technicianId: row.technician_id,
        routeDate,
        activityIds: row.activity_ids,
      });
    }
    return rows.length;
  }

  private nearestNeighbor(activities: Activity[]): Activity[] {
    if (activities.length < 2) return [...activities];
    const remaining = [...activities];
    const ordered = [remaining.shift()];
    while (remaining.length) {
      const previous = ordered[ordered.length - 1];
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      remaining.forEach((candidate, index) => {
        const distance = this.haversine(
          Number(previous.site.latitude),
          Number(previous.site.longitude),
          Number(candidate.site.latitude),
          Number(candidate.site.longitude),
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      ordered.push(remaining.splice(bestIndex, 1)[0]);
    }
    return ordered;
  }

  private async getRouteMetrics(activities: Activity[]): Promise<{
    provider: string;
    totalDistanceKm: number;
    totalTravelMinutes: number;
    trafficApplied: boolean;
    legs: Array<{ distanceKm: number; durationMinutes: number }>;
  }> {
    const coordinates = activities.map((activity) => [
      Number(activity.site.longitude),
      Number(activity.site.latitude),
    ]);
    const apiKey = this.config.get<string>('OPENROUTESERVICE_API_KEY');
    if (apiKey && coordinates.length > 1) {
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          method: 'POST',
          headers: {
            authorization: apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ coordinates }),
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (response.ok) {
        const payload = (await response.json()) as {
          routes?: Array<{
            summary: { distance: number; duration: number };
            segments: Array<{ distance: number; duration: number }>;
          }>;
        };
        const route = payload.routes?.[0];
        if (route) {
          return {
            provider: 'openrouteservice',
            totalDistanceKm: Number((route.summary.distance / 1000).toFixed(2)),
            totalTravelMinutes: Math.ceil(route.summary.duration / 60),
            trafficApplied: false,
            legs: [
              { distanceKm: 0, durationMinutes: 0 },
              ...route.segments.map((segment) => ({
                distanceKm: Number((segment.distance / 1000).toFixed(2)),
                durationMinutes: Math.ceil(segment.duration / 60),
              })),
            ],
          };
        }
      }
    }
    const legs = activities.map((activity, index) => {
      if (index === 0) return { distanceKm: 0, durationMinutes: 0 };
      const previous = activities[index - 1];
      const distanceKm = this.haversine(
        Number(previous.site.latitude),
        Number(previous.site.longitude),
        Number(activity.site.latitude),
        Number(activity.site.longitude),
      );
      return {
        distanceKm: Number(distanceKm.toFixed(2)),
        durationMinutes: Math.ceil((distanceKm / 45) * 60),
      };
    });
    return {
      provider: 'internal',
      totalDistanceKm: Number(
        legs.reduce((sum, leg) => sum + leg.distanceKm, 0).toFixed(2),
      ),
      totalTravelMinutes: legs.reduce(
        (sum, leg) => sum + leg.durationMinutes,
        0,
      ),
      trafficApplied: false,
      legs,
    };
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const radius = 6371;
    const radians = (value: number) => (value * Math.PI) / 180;
    const dLat = radians(lat2 - lat1);
    const dLon = radians(lon2 - lon1);
    const value =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radians(lat1)) *
        Math.cos(radians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }
}
