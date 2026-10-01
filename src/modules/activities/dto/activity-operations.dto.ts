import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ActivityStatus,
  AssignmentSource,
  AttachmentType,
} from '../../../common/enums/platform.enums';

export class AssignActivityDto {
  @ApiProperty()
  @IsUUID('4')
  technicianId: string;

  @ApiPropertyOptional({
    enum: AssignmentSource,
    default: AssignmentSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(AssignmentSource)
  source?: AssignmentSource;

  @ApiProperty()
  @IsDateString()
  scheduledStart: string;

  @ApiProperty()
  @IsDateString()
  scheduledEnd: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  overrideReason?: string;
}

export class AssignmentSuggestionDto {
  @IsUUID('4')
  technicianId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  rank: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  score: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  distanceKm: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  travelTimeMinutes: number;

  @IsDateString()
  availableAt: string;

  @IsDateString()
  estimatedArrivalAt: string;
}

export class ChangeActivityStatusDto {
  @ApiProperty({ enum: ActivityStatus })
  @IsEnum(ActivityStatus)
  status: ActivityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

export class CreateActivityNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class CreateAttachmentDto {
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(500)
  storageKey: string;

  @IsString()
  @MaxLength(120)
  mimeType: string;

  @IsString()
  sizeBytes: string;
}

export class CreateCustomerSignatureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  signerName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  signerRole?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  signatureStorageKey: string;

  @IsDateString()
  signedAt: string;
}
