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
import { CreateRoutePlanDto } from './dto/create-route-plan.dto';
import { RoutingService } from './routing.service';

class RouteDateQueryDto {
  @IsDateString({ strict: true }) date: string;
}

@ApiTags('Route Optimization')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('routes')
export class RoutingController {
  constructor(private readonly service: RoutingService) {}
  @Post('optimize') @Permissions('routes.manage') optimize(
    @Body() dto: CreateRoutePlanDto,
  ) {
    return this.service.optimize(dto);
  }
  @Get(':id') @Permissions('routes.read') findOne(
    @Param('id', UuidValidationPipe) id: string,
  ) {
    return this.service.findOne(id);
  }
  @Get('technician/:technicianId') @Permissions('routes.read') findByTechnician(
    @Param('technicianId', UuidValidationPipe) id: string,
    @Query() query: RouteDateQueryDto,
  ) {
    return this.service.findByTechnician(id, query.date);
  }
}
