import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationStatus } from '../../common/enums/platform.enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationStatusDto } from './dto/update-notification-status.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Post() @Permissions('notifications.create') create(
    @Body() dto: CreateNotificationDto,
  ) {
    return this.service.create(dto);
  }
  @Get() @Permissions('notifications.read') findAll(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: NotificationStatus,
  ) {
    return this.service.findAll(query, status);
  }
  @Patch(':id/status') @Permissions('notifications.update') updateStatus(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateNotificationStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
