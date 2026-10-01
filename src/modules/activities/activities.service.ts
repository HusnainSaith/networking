import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import {
  ActivityStatus,
  AssignmentSource,
  AssignmentStatus,
  TechnicianStatus,
} from '../../common/enums/platform.enums';
import { ServiceResponse } from '../../common/interfaces/service-response.interface';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerSite } from '../customers/entities/customer-site.entity';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity';
import { TechnicianLocation } from '../tracking/entities/technician-location.entity';
import { ActivityAssignment } from './entities/activity-assignment.entity';
import { ActivityAttachment } from './entities/activity-attachment.entity';
import { ActivityNote } from './entities/activity-note.entity';
import { ActivityStatusHistory } from './entities/activity-status-history.entity';
import { Activity } from './entities/activity.entity';
import { CustomerSignature } from './entities/customer-signature.entity';
import { FileStorageService } from '../../common/services/file-storage.service';
import { AttachmentType } from '../../common/enums/platform.enums';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../../common/enums/platform.enums';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import {
  AssignActivityDto,
  ChangeActivityStatusDto,
  CreateActivityNoteDto,
  CreateAttachmentDto,
  CreateCustomerSignatureDto,
} from './dto/activity-operations.dto';

const STATUS_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> = {
  [ActivityStatus.DRAFT]: [ActivityStatus.UNASSIGNED, ActivityStatus.CANCELLED],
  [ActivityStatus.UNASSIGNED]: [
    ActivityStatus.SCHEDULED,
    ActivityStatus.CANCELLED,
  ],
  [ActivityStatus.SCHEDULED]: [
    ActivityStatus.TRAVELLING,
    ActivityStatus.IN_PROGRESS,
    ActivityStatus.DELAYED,
    ActivityStatus.CANCELLED,
  ],
  [ActivityStatus.TRAVELLING]: [
    ActivityStatus.IN_PROGRESS,
    ActivityStatus.DELAYED,
    ActivityStatus.CANCELLED,
  ],
  [ActivityStatus.IN_PROGRESS]: [
    ActivityStatus.PAUSED,
    ActivityStatus.COMPLETED,
    ActivityStatus.DELAYED,
  ],
  [ActivityStatus.PAUSED]: [
    ActivityStatus.IN_PROGRESS,
    ActivityStatus.CANCELLED,
  ],
  [ActivityStatus.DELAYED]: [
    ActivityStatus.TRAVELLING,
    ActivityStatus.IN_PROGRESS,
    ActivityStatus.CANCELLED,
  ],
  [ActivityStatus.COMPLETED]: [],
  [ActivityStatus.CANCELLED]: [],
};

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Activity)
    private readonly activities: Repository<Activity>,
    @InjectRepository(ActivityAssignment)
    private readonly assignments: Repository<ActivityAssignment>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(CustomerSite)
    private readonly sites: Repository<CustomerSite>,
    @InjectRepository(TechnicianProfile)
    private readonly technicians: Repository<TechnicianProfile>,
    @InjectRepository(TechnicianLocation)
    private readonly locations: Repository<TechnicianLocation>,
    @InjectRepository(ActivityNote)
    private readonly notes: Repository<ActivityNote>,
    @InjectRepository(ActivityAttachment)
    private readonly attachments: Repository<ActivityAttachment>,
    @InjectRepository(CustomerSignature)
    private readonly signatures: Repository<CustomerSignature>,
    private readonly fileStorage: FileStorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreateActivityDto,
    userId: string,
  ): Promise<ServiceResponse<Activity>> {
    await this.validateCustomerSite(dto.customerId, dto.siteId);
    this.validatePreference(dto);
    const activity = this.activities.create({
      ...dto,
      createdById: userId,
      referenceNumber: `ACT-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
    });
    const saved = await this.activities.save(activity);
    return {
      success: true,
      message: 'Activity created successfully',
      data: saved,
    };
  }

  async findAll(query: ActivityQueryDto): Promise<ServiceResponse<Activity[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.baseQuery()
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('activity.scheduledStart', 'ASC', 'NULLS LAST')
      .addOrderBy('activity.createdAt', 'DESC');
    if (query.status)
      qb.andWhere('activity.status = :status', { status: query.status });
    if (query.priority)
      qb.andWhere('activity.priority = :priority', {
        priority: query.priority,
      });
    if (query.customerId)
      qb.andWhere('activity.customerId = :customerId', {
        customerId: query.customerId,
      });
    if (query.technicianId)
      qb.andWhere('assignment.technicianId = :technicianId', {
        technicianId: query.technicianId,
      });
    if (query.from)
      qb.andWhere('activity.scheduledStart >= :from', {
        from: `${query.from}T00:00:00.000Z`,
      });
    if (query.to)
      qb.andWhere("activity.scheduledStart < (:to::date + INTERVAL '1 day')", {
        to: query.to,
      });
    if (query.search)
      qb.andWhere(
        new Brackets((sub) =>
          sub
            .where('activity.referenceNumber ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('activity.title ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('customer.companyName ILIKE :search', {
              search: `%${query.search}%`,
            }),
        ),
      );
    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      message: 'Activities retrieved successfully',
      data,
      meta: { page, limit, total },
    };
  }

  async findOne(id: string): Promise<ServiceResponse<Activity>> {
    const data = await this.baseQuery()
      .andWhere('activity.id = :id', { id })
      .getOne();
    if (!data) throw new NotFoundException('Activity not found');
    return { success: true, message: 'Activity retrieved successfully', data };
  }

  async update(
    id: string,
    dto: UpdateActivityDto,
  ): Promise<ServiceResponse<Activity>> {
    const activity = await this.requireActivity(id);
    const customerId = dto.customerId ?? activity.customerId;
    const siteId = dto.siteId ?? activity.siteId;
    await this.validateCustomerSite(customerId, siteId);
    this.validatePreference(dto);
    this.activities.merge(activity, dto);
    await this.activities.save(activity);
    return this.findOne(id);
  }

  async remove(id: string): Promise<ServiceResponse<void>> {
    const activity = await this.requireActivity(id);
    if (
      ![
        ActivityStatus.DRAFT,
        ActivityStatus.UNASSIGNED,
        ActivityStatus.CANCELLED,
      ].includes(activity.status)
    ) {
      throw new ConflictException(
        'Only draft, unassigned, or cancelled activities can be deleted',
      );
    }
    await this.activities.remove(activity);
    return { success: true, message: 'Activity deleted successfully' };
  }

  async assign(
    id: string,
    dto: AssignActivityDto,
    userId: string,
  ): Promise<ServiceResponse<ActivityAssignment>> {
    const activity = await this.requireActivity(id);
    const technician = await this.technicians.findOne({
      where: { id: dto.technicianId, isActive: true },
      relations: { user: true },
    });
    if (!technician) throw new NotFoundException('Active technician not found');
    const start = new Date(dto.scheduledStart);
    const end = new Date(dto.scheduledEnd);
    if (end <= start)
      throw new BadRequestException(
        'Scheduled end must be after scheduled start',
      );
    const conflict = await this.assignments
      .createQueryBuilder('assignment')
      .where('assignment.technicianId = :technicianId', {
        technicianId: dto.technicianId,
      })
      .andWhere('assignment.status IN (:...statuses)', {
        statuses: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED],
      })
      .andWhere(
        'assignment.scheduledStart < :end AND assignment.scheduledEnd > :start',
        { start, end },
      )
      .andWhere('assignment.activityId != :activityId', { activityId: id })
      .getExists();
    if (conflict)
      throw new ConflictException(
        'Technician already has an overlapping activity',
      );
    const data = await this.dataSource.transaction(
      'SERIALIZABLE',
      async (manager) => {
        await manager.update(
          ActivityAssignment,
          {
            activityId: id,
            status: In([AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED]),
          },
          { status: AssignmentStatus.CANCELLED },
        );
        const assignment = await manager.save(
          ActivityAssignment,
          manager.create(ActivityAssignment, {
            activityId: id,
            technicianId: dto.technicianId,
            source: dto.source ?? AssignmentSource.MANUAL,
            status: AssignmentStatus.ASSIGNED,
            scheduledStart: start,
            scheduledEnd: end,
            assignedById: userId,
            overrideReason: dto.overrideReason,
          }),
        );
        await manager.update(Activity, id, {
          status: ActivityStatus.SCHEDULED,
          scheduledStart: start,
          scheduledEnd: end,
        });
        await manager.save(
          ActivityStatusHistory,
          manager.create(ActivityStatusHistory, {
            activityId: id,
            fromStatus: activity.status,
            toStatus: ActivityStatus.SCHEDULED,
            changedById: userId,
            reason: dto.overrideReason ?? 'Technician assigned',
          }),
        );
        return assignment;
      },
    );
    await this.notificationsService.create({
      activityId: id,
      userId: technician.userId,
      channel: NotificationChannel.EMAIL,
      recipient: technician.user.email,
      subject: `Activity assigned: ${activity.referenceNumber}`,
      body: `A new activity has been scheduled for ${dto.scheduledStart}.`,
    });
    const customer = await this.customers.findOneBy({
      id: activity.customerId,
    });
    if (customer) {
      await this.notificationsService.create({
        activityId: id,
        channel: NotificationChannel.EMAIL,
        recipient: customer.email,
        subject: `Appointment scheduled: ${activity.referenceNumber}`,
        body: `Your appointment is scheduled for ${dto.scheduledStart}.`,
      });
    }
    return { success: true, message: 'Activity assigned successfully', data };
  }

  async suggestTechnicians(
    id: string,
  ): Promise<ServiceResponse<Record<string, unknown>[]>> {
    const activity = await this.activities.findOne({
      where: { id },
      relations: { site: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    const technicians = await this.technicians.find({
      where: {
        isActive: true,
        status: In([
          TechnicianStatus.AVAILABLE,
          TechnicianStatus.BUSY,
          TechnicianStatus.TRAVELLING,
        ]),
      },
      relations: { skills: { skill: true }, regions: true },
    });
    const latestLocations = await this.locations
      .createQueryBuilder('location')
      .distinctOn(['location.technicianId'])
      .orderBy('location.technicianId')
      .addOrderBy('location.recordedAt', 'DESC')
      .getMany();
    const locationMap = new Map(
      latestLocations.map((item) => [item.technicianId, item]),
    );
    const start = activity.scheduledStart ?? this.preferredStart(activity);
    const end = new Date(
      start.getTime() + activity.estimatedDurationMinutes * 60_000,
    );
    const conflicts = await this.assignments
      .createQueryBuilder('assignment')
      .select('assignment.technicianId', 'technicianId')
      .where('assignment.status IN (:...statuses)', {
        statuses: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED],
      })
      .andWhere(
        'assignment.scheduledStart < :end AND assignment.scheduledEnd > :start',
        { start, end },
      )
      .getRawMany();
    const unavailable = new Set(conflicts.map((item) => item.technicianId));
    const ranked = technicians
      .filter((item) => !unavailable.has(item.id))
      .map((technician) => {
        const location = locationMap.get(technician.id);
        const distanceKm = location
          ? this.haversine(
              Number(location.latitude),
              Number(location.longitude),
              Number(activity.site.latitude),
              Number(activity.site.longitude),
            )
          : null;
        const regionMatch = technician.regions.some(
          (item) =>
            item.region.toLowerCase() === activity.site.region.toLowerCase(),
        );
        const skillMatch = technician.skills.some((item) =>
          item.skill.name
            .toLowerCase()
            .replace(/\s+/g, '_')
            .includes(activity.type.replace(/_installation$/, '')),
        );
        const distanceScore =
          distanceKm === null ? 0 : Math.max(0, 50 - distanceKm * 0.5);
        const score = Math.min(
          100,
          distanceScore + (regionMatch ? 25 : 0) + (skillMatch ? 25 : 0),
        );
        return {
          technicianId: technician.id,
          name: `${technician.firstName} ${technician.lastName}`,
          status: technician.status,
          distanceKm:
            distanceKm === null ? null : Number(distanceKm.toFixed(2)),
          travelTimeMinutes:
            distanceKm === null ? null : Math.ceil((distanceKm / 45) * 60),
          availableAt: start,
          estimatedArrivalAt:
            distanceKm === null
              ? null
              : new Date(
                  start.getTime() + Math.ceil((distanceKm / 45) * 60) * 60_000,
                ),
          score: Number(score.toFixed(2)),
          regionMatch,
          skillMatch,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item, index) => ({ rank: index + 1, ...item }));
    return {
      success: true,
      message: 'Technician suggestions generated successfully',
      data: ranked,
    };
  }

  async changeStatus(
    id: string,
    dto: ChangeActivityStatusDto,
    userId: string,
  ): Promise<ServiceResponse<Activity>> {
    const activity = await this.requireActivity(id);
    if (!STATUS_TRANSITIONS[activity.status].includes(dto.status))
      throw new BadRequestException(
        `Cannot transition activity from ${activity.status} to ${dto.status}`,
      );
    await this.dataSource.transaction(async (manager) => {
      const timestamps: Partial<Activity> = {};
      if (dto.status === ActivityStatus.IN_PROGRESS && !activity.actualStart)
        timestamps.actualStart = new Date();
      if (dto.status === ActivityStatus.COMPLETED)
        timestamps.actualEnd = new Date();
      await manager.update(Activity, id, { status: dto.status, ...timestamps });
      await manager.save(
        ActivityStatusHistory,
        manager.create(ActivityStatusHistory, {
          activityId: id,
          fromStatus: activity.status,
          toStatus: dto.status,
          changedById: userId,
          reason: dto.reason,
        }),
      );
      if (dto.status === ActivityStatus.COMPLETED)
        await manager.update(
          ActivityAssignment,
          {
            activityId: id,
            status: In([AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED]),
          },
          { status: AssignmentStatus.COMPLETED },
        );
    });
    if (dto.status === ActivityStatus.COMPLETED) {
      const customer = await this.customers.findOneBy({
        id: activity.customerId,
      });
      if (customer) {
        await this.notificationsService.create({
          activityId: id,
          channel: NotificationChannel.EMAIL,
          recipient: customer.email,
          subject: `Activity completed: ${activity.referenceNumber}`,
          body: 'The scheduled activity has been completed successfully.',
        });
      }
    }
    return this.findOne(id);
  }

  async addNote(
    activityId: string,
    dto: CreateActivityNoteDto,
    userId: string,
  ) {
    await this.requireActivity(activityId);
    const data = await this.notes.save(
      this.notes.create({ ...dto, activityId, authorId: userId }),
    );
    return { success: true, message: 'Note added successfully', data };
  }
  async addAttachment(
    activityId: string,
    dto: CreateAttachmentDto,
    userId: string,
  ) {
    await this.requireActivity(activityId);
    const data = await this.attachments.save(
      this.attachments.create({ ...dto, activityId, uploadedById: userId }),
    );
    return {
      success: true,
      message: 'Attachment registered successfully',
      data,
    };
  }

  async uploadAttachment(
    activityId: string,
    file: Express.Multer.File,
    userId: string,
    requestedType?: AttachmentType,
  ) {
    await this.requireActivity(activityId);
    const storageKey = await this.fileStorage.store(file, activityId);
    const type =
      requestedType ||
      (file.mimetype.startsWith('image/')
        ? AttachmentType.PHOTO
        : file.mimetype === 'application/pdf'
          ? AttachmentType.PDF
          : AttachmentType.DOCUMENT);
    const data = await this.attachments.save(
      this.attachments.create({
        activityId,
        uploadedById: userId,
        type,
        fileName: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: String(file.size),
      }),
    );
    return { success: true, message: 'Evidence uploaded successfully', data };
  }

  async openAttachment(id: string) {
    const attachment = await this.attachments.findOneBy({ id });
    if (!attachment) throw new NotFoundException('Attachment not found');
    const file = await this.fileStorage.open(attachment.storageKey);
    return { attachment, ...file };
  }
  async addSignature(
    activityId: string,
    dto: CreateCustomerSignatureDto,
    ipAddress?: string,
  ) {
    await this.requireActivity(activityId);
    const data = await this.signatures.save(
      this.signatures.create({
        ...dto,
        activityId,
        signedAt: new Date(dto.signedAt),
        ipAddress,
      }),
    );
    return {
      success: true,
      message: 'Customer signature recorded successfully',
      data,
    };
  }

  private baseQuery() {
    return this.activities
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.customer', 'customer')
      .leftJoinAndSelect('activity.site', 'site')
      .leftJoinAndSelect('activity.assignments', 'assignment')
      .leftJoinAndSelect('assignment.technician', 'technician')
      .leftJoinAndSelect('activity.attachments', 'attachment')
      .leftJoinAndSelect('activity.notes', 'note')
      .leftJoinAndSelect('activity.signatures', 'signature')
      .leftJoinAndSelect('activity.statusHistory', 'history');
  }
  private async requireActivity(id: string) {
    const item = await this.activities.findOneBy({ id });
    if (!item) throw new NotFoundException('Activity not found');
    return item;
  }
  private async validateCustomerSite(customerId: string, siteId: string) {
    if (
      !(await this.customers.exist({
        where: { id: customerId, isActive: true },
      }))
    )
      throw new NotFoundException('Active customer not found');
    if (!(await this.sites.exist({ where: { id: siteId, customerId } })))
      throw new BadRequestException(
        'Site does not belong to the selected customer',
      );
  }
  private validatePreference(dto: Partial<CreateActivityDto>) {
    if (
      dto.preferredTimeSlot === 'specific_time' &&
      (!dto.preferredDate || !dto.preferredStartTime)
    )
      throw new BadRequestException(
        'Specific time activities require preferredDate and preferredStartTime',
      );
    if (
      dto.preferredStartTime &&
      dto.preferredEndTime &&
      dto.preferredEndTime <= dto.preferredStartTime
    )
      throw new BadRequestException(
        'Preferred end time must be after preferred start time',
      );
  }
  private preferredStart(activity: Activity) {
    const date =
      activity.preferredDate ?? new Date().toISOString().slice(0, 10);
    const time = activity.preferredStartTime ?? '09:00:00';
    return new Date(`${date}T${time}+02:00`);
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
