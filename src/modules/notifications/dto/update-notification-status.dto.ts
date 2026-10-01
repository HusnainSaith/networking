import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationStatus } from '../../../common/enums/platform.enums';

export class UpdateNotificationStatusDto {
  @IsEnum(NotificationStatus) status: NotificationStatus;
  @IsOptional() @IsString() @MaxLength(255) providerMessageId?: string;
  @IsOptional() @IsString() @MaxLength(2000) failureReason?: string;
}
