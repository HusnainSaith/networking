import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  ActivityPriority,
  ActivityStatus,
} from '../../../common/enums/platform.enums';

export class ActivityQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(ActivityStatus) status?: ActivityStatus;
  @IsOptional() @IsEnum(ActivityPriority) priority?: ActivityPriority;
  @IsOptional() @IsUUID('4') technicianId?: string;
  @IsOptional() @IsUUID('4') customerId?: string;
  @IsOptional() @IsDateString({ strict: true }) from?: string;
  @IsOptional() @IsDateString({ strict: true }) to?: string;
}
