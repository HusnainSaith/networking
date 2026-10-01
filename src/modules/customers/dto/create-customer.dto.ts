import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SiteType } from '../../../common/enums/platform.enums';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Comune di Milano', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @Transform(({ value }) => value?.trim())
  companyName: string;

  @ApiProperty({ example: 'IT12345678901', maxLength: 32 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Transform(({ value }) => value?.trim().toUpperCase())
  vatNumber: string;

  @ApiProperty({ example: 'Mario Rossi' })
  @IsString()
  @MaxLength(120)
  contactPerson: string;

  @ApiProperty({ example: 'operations@example.it' })
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ example: '+390212345678' })
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCustomerSiteDto {
  @ApiProperty()
  @IsUUID('4')
  customerId: string;

  @ApiProperty({ example: 'Milano headquarters' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: SiteType })
  @IsEnum(SiteType)
  siteType: SiteType;

  @ApiProperty({ example: 'Via Roma 10' })
  @IsString()
  @MaxLength(180)
  addressLine1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine2?: string;

  @ApiProperty({ example: 'Milano' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'MI' })
  @IsString()
  @MaxLength(100)
  province: string;

  @ApiProperty({ example: 'Lombardia' })
  @IsString()
  @MaxLength(100)
  region: string;

  @ApiProperty({ example: '20121' })
  @IsString()
  @MaxLength(16)
  postalCode: string;

  @ApiPropertyOptional({ default: 'IT' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiProperty({ example: 45.4642 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 9.19 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  contactPhone?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
