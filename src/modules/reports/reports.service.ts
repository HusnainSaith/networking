import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async technicians(query: ReportQueryDto) {
    this.validateRange(query);
    const data = await this.dataSource.query(
      `
      SELECT tp.id, tp.first_name, tp.last_name,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::int AS activities_completed,
        COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (a.actual_end - a.actual_start)) / 60)::numeric, 2), 0) AS average_completion_minutes,
        COALESCE(ROUND(SUM(aa.distance_km)::numeric, 2), 0) AS travel_distance_km,
        COALESCE(ROUND(AVG(cf.rating)::numeric, 2), 0) AS average_rating
      FROM technician_profiles tp
      LEFT JOIN activity_assignments aa ON aa.technician_id = tp.id
      LEFT JOIN activities a ON a.id = aa.activity_id AND a.created_at >= $1::date AND a.created_at < ($2::date + INTERVAL '1 day')
      LEFT JOIN customer_feedback cf ON cf.activity_id = a.id
      WHERE ($3::uuid IS NULL OR tp.id = $3::uuid)
      GROUP BY tp.id, tp.first_name, tp.last_name ORDER BY activities_completed DESC
    `,
      [query.from, query.to, query.technicianId ?? null],
    );
    return {
      success: true,
      message: 'Technician report generated successfully',
      data,
    };
  }

  async customers(query: ReportQueryDto) {
    this.validateRange(query);
    const data = await this.dataSource.query(
      `
      SELECT c.id, c.company_name, COUNT(a.id)::int AS interventions,
        COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (a.actual_start - a.created_at)) / 3600)::numeric, 2), 0) AS average_response_hours,
        COALESCE(ROUND(AVG(cf.rating)::numeric, 2), 0) AS average_rating
      FROM customers c
      LEFT JOIN activities a ON a.customer_id = c.id AND a.created_at >= $1::date AND a.created_at < ($2::date + INTERVAL '1 day')
      LEFT JOIN customer_feedback cf ON cf.activity_id = a.id
      WHERE ($3::uuid IS NULL OR c.id = $3::uuid)
      GROUP BY c.id, c.company_name ORDER BY interventions DESC
    `,
      [query.from, query.to, query.customerId ?? null],
    );
    return {
      success: true,
      message: 'Customer report generated successfully',
      data,
    };
  }

  async regions(query: ReportQueryDto) {
    this.validateRange(query);
    const data = await this.dataSource.query(
      `
      SELECT cs.region, COUNT(a.id)::int AS activities,
        COUNT(a.id) FILTER (WHERE a.status = 'completed')::int AS completed,
        COUNT(a.id) FILTER (WHERE a.status = 'delayed')::int AS delayed,
        COALESCE(ROUND(AVG(cf.rating)::numeric, 2), 0) AS average_rating
      FROM activities a JOIN customer_sites cs ON cs.id = a.site_id
      LEFT JOIN customer_feedback cf ON cf.activity_id = a.id
      WHERE a.created_at >= $1::date AND a.created_at < ($2::date + INTERVAL '1 day')
      GROUP BY cs.region ORDER BY activities DESC
    `,
      [query.from, query.to],
    );
    return {
      success: true,
      message: 'Regional report generated successfully',
      data,
    };
  }

  private validateRange(query: ReportQueryDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (to < from)
      throw new BadRequestException(
        'Report end date must be on or after the start date',
      );
    if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000)
      throw new BadRequestException('Report range cannot exceed 366 days');
  }
}
