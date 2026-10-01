import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getKpis() {
    const [row] = await this.dataSource.query(`
      SELECT
        COUNT(*) FILTER (WHERE scheduled_start::date = CURRENT_DATE) AS activities_today,
        COUNT(*) FILTER (WHERE status = 'completed' AND actual_end::date = CURRENT_DATE) AS activities_completed,
        COUNT(*) FILTER (WHERE status IN ('unassigned','scheduled','travelling','in_progress','paused')) AS activities_pending,
        COUNT(*) FILTER (WHERE status = 'delayed' OR (status NOT IN ('completed','cancelled') AND scheduled_end < NOW())) AS delayed_activities,
        COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (actual_start - scheduled_start)) / 60)::numeric, 2), 0) AS average_arrival_variance_minutes
      FROM activities
    `);
    const [technicians] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS technicians_online FROM technician_profiles WHERE status != 'offline' AND is_active = true`,
    );
    const [feedback] = await this.dataSource.query(
      `SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS customer_satisfaction_score FROM customer_feedback`,
    );
    return {
      success: true,
      message: 'Dashboard KPIs retrieved successfully',
      data: { ...row, ...technicians, ...feedback },
    };
  }

  async mapData() {
    const technicians = await this.dataSource.query(`
      SELECT DISTINCT ON (tp.id) tp.id, tp.first_name, tp.last_name, tp.status,
        tl.latitude, tl.longitude, tl.speed_kph, tl.recorded_at
      FROM technician_profiles tp
      LEFT JOIN technician_locations tl ON tl.technician_id = tp.id
      WHERE tp.is_active = true
      ORDER BY tp.id, tl.recorded_at DESC
    `);
    const activities = await this.dataSource.query(`
      SELECT a.id, a.reference_number, a.title, a.status, a.priority, a.scheduled_start,
        cs.latitude, cs.longitude, cs.city, c.company_name
      FROM activities a
      JOIN customer_sites cs ON cs.id = a.site_id
      JOIN customers c ON c.id = a.customer_id
      WHERE a.status != 'cancelled' AND (a.scheduled_start::date = CURRENT_DATE OR a.status IN ('travelling','in_progress','delayed'))
    `);
    return {
      success: true,
      message: 'Map data retrieved successfully',
      data: { technicians, activities },
    };
  }
}
