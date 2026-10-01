import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { TechnicianStatus } from '../../common/enums/platform.enums';
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
import { UpdateTechnicianStatusDto } from './dto/update-technician-status.dto';
import { TechniciansService } from './technicians.service';

@ApiTags('Technicians')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly service: TechniciansService) {}

  @Post() @Permissions('technicians.create') create(
    @Body() dto: CreateTechnicianDto,
  ) {
    return this.service.create(dto);
  }
  @Get() @Permissions('technicians.read') findAll(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: TechnicianStatus,
  ) {
    return this.service.findAll(query, status);
  }
  @Get(':id') @Permissions('technicians.read') findOne(
    @Param('id', UuidValidationPipe) id: string,
  ) {
    return this.service.findOne(id);
  }
  @Patch(':id') @Permissions('technicians.update') update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateTechnicianDto,
  ) {
    return this.service.update(id, dto);
  }
  @Patch(':id/status') @Permissions('technicians.update') updateStatus(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateTechnicianStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
  @Delete(':id') @Permissions('technicians.delete') remove(
    @Param('id', UuidValidationPipe) id: string,
  ) {
    return this.service.remove(id);
  }

  @Get('catalog/skills') @Permissions('technicians.read') listSkills() {
    return this.service.listSkills();
  }
  @Post('catalog/skills') @Permissions('technicians.manage') createSkill(
    @Body() dto: CreateSkillDto,
  ) {
    return this.service.createSkill(dto);
  }
  @Patch('catalog/skills/:id') @Permissions('technicians.manage') updateSkill(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.service.updateSkill(id, dto);
  }
  @Get('catalog/certifications')
  @Permissions('technicians.read')
  listCertifications() {
    return this.service.listCertifications();
  }
  @Post('catalog/certifications')
  @Permissions('technicians.manage')
  createCertification(@Body() dto: CreateCertificationDto) {
    return this.service.createCertification(dto);
  }
  @Patch('catalog/certifications/:id')
  @Permissions('technicians.manage')
  updateCertification(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateCertificationDto,
  ) {
    return this.service.updateCertification(id, dto);
  }
  @Get('catalog/vehicles') @Permissions('technicians.read') listVehicles() {
    return this.service.listVehicles();
  }
  @Post('catalog/vehicles') @Permissions('technicians.manage') createVehicle(
    @Body() dto: CreateVehicleDto,
  ) {
    return this.service.createVehicle(dto);
  }
  @Patch('catalog/vehicles/:id')
  @Permissions('technicians.manage')
  updateVehicle(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.service.updateVehicle(id, dto);
  }
}
