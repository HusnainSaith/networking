import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ActivityPriority,
  ActivityType,
  PreferredTimeSlot,
} from '../../../common/enums/platform.enums';

export class CreateActivityDto {
  @ApiProperty()
  @IsUUID('4')
  customerId: string;

  @ApiProperty()
  @IsUUID('4')
  siteId: string;

  @ApiProperty({ example: 'Fiber installation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({ enum: ActivityPriority, default: ActivityPriority.MEDIUM })
  @IsEnum(ActivityPriority)
  priority: ActivityPriority;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(1440)
  estimatedDurationMinutes: number;

  @ApiProperty({ enum: PreferredTimeSlot, default: PreferredTimeSlot.FLEXIBLE })
  @IsEnum(PreferredTimeSlot)
  preferredTimeSlot: PreferredTimeSlot;

  @ApiPropertyOptional({ example: '2026-10-15' })
  @IsOptional()
  @IsDateString({ strict: true })
  preferredDate?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  preferredStartTime?: string;

  @ApiPropertyOptional({ example: '16:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  preferredEndTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  equipmentRequired?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  internalNotes?: string;
}
