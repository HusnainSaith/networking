import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, DeepPartial, In, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ServiceResponse } from '../../common/interfaces/service-response.interface';
import { TechnicianStatus } from '../../common/enums/platform.enums';
import { User } from '../users/entities/user.entity';
import { Certification } from './entities/certification.entity';
import { Skill } from './entities/skill.entity';
import { TechnicianCertification } from './entities/technician-certification.entity';
import { TechnicianProfile } from './entities/technician-profile.entity';
import { TechnicianRegion } from './entities/technician-region.entity';
import { TechnicianSkill } from './entities/technician-skill.entity';
import { Vehicle } from './entities/vehicle.entity';
import {
  CreateCertificationDto,
  CreateSkillDto,
  CreateTechnicianDto,
  CreateVehicleDto,
} from './dto/create-technician.dto';
import {
  UpdateCertificationDto,
  UpdateSkillDto,
  UpdateTechnicianDto,
  UpdateVehicleDto,
} from './dto/update-technician.dto';

@Injectable()
export class TechniciansService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TechnicianProfile)
    private readonly technicians: Repository<TechnicianProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Skill) private readonly skills: Repository<Skill>,
    @InjectRepository(Certification)
    private readonly certifications: Repository<Certification>,
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
  ) {}

  async create(
    dto: CreateTechnicianDto,
  ): Promise<ServiceResponse<TechnicianProfile>> {
    if (!(await this.users.exist({ where: { id: dto.userId } })))
      throw new NotFoundException('User not found');
    if (await this.technicians.exist({ where: { userId: dto.userId } }))
      throw new ConflictException('This user already has a technician profile');
    await this.validateReferences(dto);
    const data = await this.dataSource.transaction(async (manager) => {
      const {
        skills = [],
        certifications = [],
        regions = [],
        ...profileData
      } = dto;
      const profile = await manager.save(
        TechnicianProfile,
        manager.create(TechnicianProfile, profileData),
      );
      await manager.save(
        TechnicianSkill,
        skills.map((item) =>
          manager.create(TechnicianSkill, {
            ...item,
            technicianId: profile.id,
          }),
        ),
      );
      await manager.save(
        TechnicianCertification,
        certifications.map((item) =>
          manager.create(TechnicianCertification, {
            ...item,
            technicianId: profile.id,
          }),
        ),
      );
      await manager.save(
        TechnicianRegion,
        regions.map((region, index) =>
          manager.create(TechnicianRegion, {
            technicianId: profile.id,
            region,
            isPrimary: index === 0,
          }),
        ),
      );
      return profile;
    });
    return this.findOne(data.id, 'Technician created successfully');
  }

  async findAll(
    query: PaginationQueryDto,
    status?: TechnicianStatus,
  ): Promise<ServiceResponse<TechnicianProfile[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.baseQuery()
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('technician.lastName', 'ASC');
    if (status) builder.andWhere('technician.status = :status', { status });
    if (query.search)
      builder.andWhere(
        new Brackets((qb) =>
          qb
            .where('technician.firstName ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('technician.lastName ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('user.email ILIKE :search', {
              search: `%${query.search}%`,
            }),
        ),
      );
    const [data, total] = await builder.getManyAndCount();
    return {
      success: true,
      message: 'Technicians retrieved successfully',
      data,
      meta: { page, limit, total },
    };
  }

  async findOne(
    id: string,
    message = 'Technician retrieved successfully',
  ): Promise<ServiceResponse<TechnicianProfile>> {
    const data = await this.baseQuery()
      .andWhere('technician.id = :id', { id })
      .getOne();
    if (!data) throw new NotFoundException('Technician not found');
    return { success: true, message, data };
  }

  async update(
    id: string,
    dto: UpdateTechnicianDto,
  ): Promise<ServiceResponse<TechnicianProfile>> {
    const existing = await this.requireTechnician(id);
    await this.validateReferences(dto);
    await this.dataSource.transaction(async (manager) => {
      const { skills, certifications, regions, ...profileData } = dto;
      manager.merge(TechnicianProfile, existing, profileData);
      await manager.save(existing);
      if (skills) {
        await manager.delete(TechnicianSkill, { technicianId: id });
        await manager.save(
          TechnicianSkill,
          skills.map((item) =>
            manager.create(TechnicianSkill, { ...item, technicianId: id }),
          ),
        );
      }
      if (certifications) {
        await manager.delete(TechnicianCertification, { technicianId: id });
        await manager.save(
          TechnicianCertification,
          certifications.map((item) =>
            manager.create(TechnicianCertification, {
              ...item,
              technicianId: id,
            }),
          ),
        );
      }
      if (regions) {
        await manager.delete(TechnicianRegion, { technicianId: id });
        await manager.save(
          TechnicianRegion,
          regions.map((region, index) =>
            manager.create(TechnicianRegion, {
              technicianId: id,
              region,
              isPrimary: index === 0,
            }),
          ),
        );
      }
    });
    return this.findOne(id, 'Technician updated successfully');
  }

  async updateStatus(
    id: string,
    status: TechnicianStatus,
  ): Promise<ServiceResponse<TechnicianProfile>> {
    const result = await this.technicians.update(id, { status });
    if (!result.affected) throw new NotFoundException('Technician not found');
    return this.findOne(id, 'Technician status updated successfully');
  }

  async remove(id: string): Promise<ServiceResponse<void>> {
    const technician = await this.requireTechnician(id);
    await this.technicians.remove(technician);
    return { success: true, message: 'Technician deleted successfully' };
  }

  async createSkill(dto: CreateSkillDto) {
    return this.createCatalog(this.skills, dto, 'Skill');
  }
  async updateSkill(id: string, dto: UpdateSkillDto) {
    return this.updateCatalog(this.skills, id, dto, 'Skill');
  }
  async listSkills() {
    return {
      success: true,
      message: 'Skills retrieved successfully',
      data: await this.skills.find({ order: { name: 'ASC' } }),
    };
  }
  async createCertification(dto: CreateCertificationDto) {
    return this.createCatalog(this.certifications, dto, 'Certification');
  }
  async updateCertification(id: string, dto: UpdateCertificationDto) {
    return this.updateCatalog(this.certifications, id, dto, 'Certification');
  }
  async listCertifications() {
    return {
      success: true,
      message: 'Certifications retrieved successfully',
      data: await this.certifications.find({ order: { name: 'ASC' } }),
    };
  }
  async createVehicle(dto: CreateVehicleDto) {
    return this.createCatalog(
      this.vehicles,
      dto,
      'Vehicle',
      'registrationNumber',
    );
  }
  async updateVehicle(id: string, dto: UpdateVehicleDto) {
    return this.updateCatalog(this.vehicles, id, dto, 'Vehicle');
  }
  async listVehicles() {
    return {
      success: true,
      message: 'Vehicles retrieved successfully',
      data: await this.vehicles.find({ order: { registrationNumber: 'ASC' } }),
    };
  }

  private baseQuery() {
    return this.technicians
      .createQueryBuilder('technician')
      .leftJoinAndSelect('technician.user', 'user')
      .leftJoinAndSelect('technician.vehicle', 'vehicle')
      .leftJoinAndSelect('technician.skills', 'technicianSkill')
      .leftJoinAndSelect('technicianSkill.skill', 'skill')
      .leftJoinAndSelect('technician.certifications', 'technicianCertification')
      .leftJoinAndSelect(
        'technicianCertification.certification',
        'certification',
      )
      .leftJoinAndSelect('technician.regions', 'region');
  }

  private async validateReferences(
    dto: Partial<CreateTechnicianDto>,
  ): Promise<void> {
    if (
      dto.vehicleId &&
      !(await this.vehicles.exist({
        where: { id: dto.vehicleId, isActive: true },
      }))
    )
      throw new NotFoundException('Active vehicle not found');
    if (dto.skills?.length) {
      const ids = [...new Set(dto.skills.map((item) => item.skillId))];
      if ((await this.skills.countBy({ id: In(ids) })) !== ids.length)
        throw new NotFoundException('One or more skills were not found');
    }
    if (dto.certifications?.length) {
      const ids = [
        ...new Set(dto.certifications.map((item) => item.certificationId)),
      ];
      if ((await this.certifications.countBy({ id: In(ids) })) !== ids.length)
        throw new NotFoundException(
          'One or more certifications were not found',
        );
    }
  }

  private async requireTechnician(id: string): Promise<TechnicianProfile> {
    const item = await this.technicians.findOneBy({ id });
    if (!item) throw new NotFoundException('Technician not found');
    return item;
  }

  private async createCatalog<T extends object>(
    repo: Repository<T>,
    dto: DeepPartial<T>,
    label: string,
    uniqueField = 'name',
  ) {
    if (
      await repo.exist({ where: { [uniqueField]: dto[uniqueField] } as never })
    )
      throw new ConflictException(`${label} already exists`);
    const data = await repo.save(repo.create(dto as T));
    return { success: true, message: `${label} created successfully`, data };
  }

  private async updateCatalog<T extends object>(
    repo: Repository<T>,
    id: string,
    dto: DeepPartial<T>,
    label: string,
  ) {
    const item = await repo.findOne({ where: { id } as never });
    if (!item) throw new NotFoundException(`${label} not found`);
    repo.merge(item, dto);
    const data = await repo.save(item);
    return { success: true, message: `${label} updated successfully`, data };
  }
}
