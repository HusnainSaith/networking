import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecordLocationDto } from './dto/record-location.dto';
import { TrackingService } from './tracking.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class LocationHistoryQueryDto {
  @IsDateString() from: string;
  @IsDateString() to: string;
}

@ApiTags('Real-time Tracking')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tracking')
export class TrackingController {
  constructor(private readonly service: TrackingService) {}

  @Post(':technicianId/locations') @Permissions('tracking.update') record(
    @Param('technicianId', UuidValidationPipe) technicianId: string,
    @Body() dto: RecordLocationDto,
    @CurrentUser() requester: { id: string; role?: { name?: string } },
  ) {
    return this.service.record(technicianId, dto, requester);
  }
  @Get('current') @Permissions('tracking.read') current() {
    return this.service.current();
  }
  @Get(':technicianId/history') @Permissions('tracking.read') history(
    @Param('technicianId', UuidValidationPipe) technicianId: string,
    @Query() query: LocationHistoryQueryDto,
  ) {
    return this.service.history(technicianId, query.from, query.to);
  }
}
