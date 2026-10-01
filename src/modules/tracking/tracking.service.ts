import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ServiceResponse } from '../../common/interfaces/service-response.interface';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity';
import { RecordLocationDto } from './dto/record-location.dto';
import { TechnicianLocation } from './entities/technician-location.entity';
import { TrackingGateway } from './tracking.gateway';
import { RoleEnum } from '../roles/role.enum';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TechnicianLocation)
    private readonly locations: Repository<TechnicianLocation>,
    @InjectRepository(TechnicianProfile)
    private readonly technicians: Repository<TechnicianProfile>,
    private readonly gateway: TrackingGateway,
  ) {}

  async record(
    technicianId: string,
    dto: RecordLocationDto,
    requester: { id: string; role?: { name?: string } },
  ): Promise<ServiceResponse<TechnicianLocation>> {
    const technician = await this.technicians.findOne({
      where: { id: technicianId, isActive: true },
      select: { id: true, userId: true },
    });
    if (!technician) throw new NotFoundException('Active technician not found');
    const privileged = [RoleEnum.ADMIN, RoleEnum.DISPATCHER].includes(
      requester.role?.name as RoleEnum,
    );
    if (!privileged && technician.userId !== requester.id)
      throw new NotFoundException('Active technician not found');
    const data = await this.locations.save(
      this.locations.create({
        ...dto,
        technicianId,
        recordedAt: new Date(dto.recordedAt),
      }),
    );
    this.gateway.broadcastLocation(data);
    return { success: true, message: 'Location recorded successfully', data };
  }

  async current(): Promise<ServiceResponse<TechnicianLocation[]>> {
    const data = await this.locations
      .createQueryBuilder('location')
      .distinctOn(['location.technicianId'])
      .leftJoinAndSelect('location.technician', 'technician')
      .leftJoinAndSelect('technician.user', 'user')
      .orderBy('location.technicianId')
      .addOrderBy('location.recordedAt', 'DESC')
      .getMany();
    return {
      success: true,
      message: 'Current technician locations retrieved successfully',
      data,
    };
  }

  async history(
    technicianId: string,
    from: string,
    to: string,
  ): Promise<ServiceResponse<TechnicianLocation[]>> {
    if (!(await this.technicians.exist({ where: { id: technicianId } })))
      throw new NotFoundException('Technician not found');
    const start = new Date(from);
    const end = new Date(to);
    const maximumRange = 31 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maximumRange)
      end.setTime(start.getTime() + maximumRange);
    const data = await this.locations.find({
      where: { technicianId, recordedAt: Between(start, end) },
      order: { recordedAt: 'ASC' },
      take: 20_000,
    });
    return {
      success: true,
      message: 'Technician route history retrieved successfully',
      data,
    };
  }
}
