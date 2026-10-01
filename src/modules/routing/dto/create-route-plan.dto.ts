import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateRoutePlanDto {
  @IsUUID('4') technicianId: string;
  @IsDateString({ strict: true }) routeDate: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  activityIds: string[];
  @IsOptional() @IsString() @MaxLength(40) provider?: string;
}
