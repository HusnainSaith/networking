import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { NotificationChannel } from '../../../common/enums/platform.enums';

export class CreateNotificationDto {
  @IsOptional()
  @IsUUID('4')
  activityId?: string;

  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  @MaxLength(255)
  recipient: string;

  @ValidateIf((value) => value.channel === NotificationChannel.EMAIL)
  @IsString()
  @MaxLength(180)
  subject?: string;

  @IsString()
  @MaxLength(5000)
  body: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
