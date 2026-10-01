import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { NotificationStatus } from '../../common/enums/platform.enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Activity } from '../activities/entities/activity.entity';
import { User } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationStatusDto } from './dto/update-notification-status.dto';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(Activity)
    private readonly activities: Repository<Activity>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'notification-delivery' })
  async processPending(): Promise<void> {
    if (this.config.get('NOTIFICATION_ENABLED', 'true') !== 'true') return;
    const claimed: Notification[] = await this.dataSource.query(`
      UPDATE notifications
      SET status = 'processing', updated_at = NOW()
      WHERE id IN (
        SELECT id FROM notifications
        WHERE status = 'pending' AND COALESCE(scheduled_at, NOW()) <= NOW()
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 50
      )
      RETURNING *
    `);
    await Promise.allSettled(claimed.map((item) => this.deliver(item)));
  }

  async create(dto: CreateNotificationDto) {
    if (!dto.activityId && !dto.userId)
      throw new BadRequestException('An activityId or userId is required');
    if (
      dto.activityId &&
      !(await this.activities.exist({ where: { id: dto.activityId } }))
    )
      throw new NotFoundException('Activity not found');
    if (dto.userId && !(await this.users.exist({ where: { id: dto.userId } })))
      throw new NotFoundException('User not found');
    const data = await this.notifications.save(
      this.notifications.create({
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
      }),
    );
    return { success: true, message: 'Notification queued successfully', data };
  }

  async findAll(query: PaginationQueryDto, status?: NotificationStatus) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.notifications
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.activity', 'activity')
      .leftJoinAndSelect('notification.user', 'user')
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (status) qb.andWhere('notification.status = :status', { status });
    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data,
      meta: { page, limit, total },
    };
  }

  async updateStatus(id: string, dto: UpdateNotificationStatusDto) {
    const notification = await this.notifications.findOneBy({ id });
    if (!notification) throw new NotFoundException('Notification not found');
    this.notifications.merge(notification, {
      ...dto,
      sentAt:
        dto.status === NotificationStatus.SENT
          ? new Date()
          : notification.sentAt,
      deliveredAt:
        dto.status === NotificationStatus.DELIVERED
          ? new Date()
          : notification.deliveredAt,
    });
    const data = await this.notifications.save(notification);
    return {
      success: true,
      message: 'Notification status updated successfully',
      data,
    };
  }

  private async deliver(notification: Notification): Promise<void> {
    try {
      let providerMessageId: string | undefined;
      if (notification.channel === 'email') {
        providerMessageId = await this.sendEmail(notification);
      } else {
        providerMessageId = await this.sendWebhook(notification);
      }
      await this.notifications.update(notification.id, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        providerMessageId,
        failureReason: null,
      });
    } catch (error) {
      await this.notifications.update(notification.id, {
        status: NotificationStatus.FAILED,
        failureReason:
          error instanceof Error
            ? error.message.slice(0, 2000)
            : 'Unknown delivery error',
      });
    }
  }

  private async sendEmail(notification: Notification): Promise<string> {
    const host = this.config.get<string>('SMTP_HOST');
    const user =
      this.config.get<string>('SMTP_USER') ||
      this.config.get<string>('EMAIL_USER');
    const pass =
      this.config.get<string>('SMTP_PASS') ||
      this.config.get<string>('EMAIL_PASS');
    if (!host || !user || !pass)
      throw new Error('SMTP provider is not configured');
    const transport = nodemailer.createTransport({
      host,
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: { user, pass },
    });
    const result = await transport.sendMail({
      from: this.config.get<string>('EMAIL_FROM_ADDRESS', user),
      to: notification.recipient,
      subject: notification.subject || 'Service notification',
      text: notification.body,
    });
    return result.messageId;
  }

  private async sendWebhook(notification: Notification): Promise<string> {
    const key = `${notification.channel.toUpperCase()}_WEBHOOK_URL`;
    const url = this.config.get<string>(key);
    if (!url)
      throw new Error(`${notification.channel} provider is not configured`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        recipient: notification.recipient,
        subject: notification.subject,
        body: notification.body,
        notificationId: notification.id,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      throw new Error(`Provider returned HTTP ${response.status}`);
    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
    };
    return (
      payload.id || response.headers.get('x-message-id') || notification.id
    );
  }
}
