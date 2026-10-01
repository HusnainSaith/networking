import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ReportQueryDto {
  @IsDateString({ strict: true }) from: string;
  @IsDateString({ strict: true }) to: string;
  @IsOptional() @IsUUID('4') technicianId?: string;
  @IsOptional() @IsUUID('4') customerId?: string;
}
