import { PartialType } from '@nestjs/swagger';
import {
  CreateCustomerDto,
  CreateCustomerSiteDto,
} from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
export class UpdateCustomerSiteDto extends PartialType(CreateCustomerSiteDto) {}
