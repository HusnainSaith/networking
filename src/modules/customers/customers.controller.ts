import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  CreateCustomerSiteDto,
} from './dto/create-customer.dto';
import {
  UpdateCustomerDto,
  UpdateCustomerSiteDto,
} from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  @Permissions('customers.create')
  @ApiOperation({ summary: 'Create a customer' })
  create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('customers.read')
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('customers.read')
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('customers.update')
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('customers.delete')
  remove(@Param('id', UuidValidationPipe) id: string) {
    return this.service.remove(id);
  }

  @Post('sites')
  @Permissions('customers.update')
  createSite(@Body() dto: CreateCustomerSiteDto) {
    return this.service.createSite(dto);
  }

  @Patch('sites/:id')
  @Permissions('customers.update')
  updateSite(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateCustomerSiteDto,
  ) {
    return this.service.updateSite(id, dto);
  }

  @Delete('sites/:id')
  @Permissions('customers.update')
  removeSite(@Param('id', UuidValidationPipe) id: string) {
    return this.service.removeSite(id);
  }
}
