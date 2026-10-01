import { IsEnum } from 'class-validator';
import { TechnicianStatus } from '../../../common/enums/platform.enums';

export class UpdateTechnicianStatusDto {
  @IsEnum(TechnicianStatus)
  status: TechnicianStatus;
}
