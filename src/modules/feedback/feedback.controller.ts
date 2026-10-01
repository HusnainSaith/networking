import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCustomerFeedbackDto } from './dto/create-customer-feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('Customer Feedback')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}
  @Post() @Permissions('feedback.create') create(
    @Body() dto: CreateCustomerFeedbackDto,
  ) {
    return this.service.create(dto);
  }
  @Get('customer/:customerId') @Permissions('feedback.read') findByCustomer(
    @Param('customerId', UuidValidationPipe) customerId: string,
  ) {
    return this.service.findByCustomer(customerId);
  }
}
