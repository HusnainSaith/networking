import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TechnicianStatus } from '../../../common/enums/platform.enums';

export class TechnicianSkillInputDto {
  @IsUUID('4')
  skillId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  proficiency: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(99.9)
  yearsExperience?: number;
}

export class TechnicianCertificationInputDto {
  @IsUUID('4')
  certificationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  certificateNumber?: string;

  @IsOptional()
  @IsString()
  issuedAt?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class CreateTechnicianDto {
  @ApiProperty()
  @IsUUID('4')
  userId: string;

  @ApiProperty({ example: 'Luca' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ example: 'Bianchi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({ example: '+393331234567' })
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @ApiPropertyOptional({
    enum: TechnicianStatus,
    default: TechnicianStatus.OFFLINE,
  })
  @IsOptional()
  @IsEnum(TechnicianStatus)
  status?: TechnicianStatus;

  @ApiPropertyOptional({ default: 480 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(1440)
  maxDailyMinutes?: number;

  @ApiPropertyOptional({ type: [TechnicianSkillInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TechnicianSkillInputDto)
  skills?: TechnicianSkillInputDto[];

  @ApiPropertyOptional({ type: [TechnicianCertificationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TechnicianCertificationInputDto)
  certifications?: TechnicianCertificationInputDto[];

  @ApiPropertyOptional({ example: ['Lombardia', 'Piemonte'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  regions?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class CreateCertificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  issuer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  registrationNumber: string;

  @IsString()
  @MaxLength(80)
  make: string;

  @IsString()
  @MaxLength(80)
  model: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
