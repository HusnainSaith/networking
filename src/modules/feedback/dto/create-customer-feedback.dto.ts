import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCustomerFeedbackDto {
  @IsUUID('4')
  activityId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  comments?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  submittedBy?: string;
}
