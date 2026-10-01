import { PartialType } from '@nestjs/swagger';
import {
  CreateCertificationDto,
  CreateSkillDto,
  CreateTechnicianDto,
  CreateVehicleDto,
} from './create-technician.dto';

export class UpdateTechnicianDto extends PartialType(CreateTechnicianDto) {}
export class UpdateSkillDto extends PartialType(CreateSkillDto) {}
export class UpdateCertificationDto extends PartialType(
  CreateCertificationDto,
) {}
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
