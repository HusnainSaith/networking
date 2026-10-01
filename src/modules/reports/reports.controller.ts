import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}
  @Get('technicians') @Permissions('reports.read') technicians(
    @Query() query: ReportQueryDto,
  ) {
    return this.service.technicians(query);
  }
  @Get('customers') @Permissions('reports.read') customers(
    @Query() query: ReportQueryDto,
  ) {
    return this.service.customers(query);
  }
  @Get('regions') @Permissions('reports.read') regions(
    @Query() query: ReportQueryDto,
  ) {
    return this.service.regions(query);
  }
}
