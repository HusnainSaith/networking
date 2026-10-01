import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ServiceResponse } from '../../common/interfaces/service-response.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Customer } from './entities/customer.entity';
import { CustomerSite } from './entities/customer-site.entity';
import {
  CreateCustomerDto,
  CreateCustomerSiteDto,
} from './dto/create-customer.dto';
import {
  UpdateCustomerDto,
  UpdateCustomerSiteDto,
} from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(CustomerSite)
    private readonly sites: Repository<CustomerSite>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<ServiceResponse<Customer>> {
    if (await this.customers.exist({ where: { vatNumber: dto.vatNumber } })) {
      throw new ConflictException(
        'A customer with this VAT number already exists',
      );
    }
    const customer = await this.customers.save(this.customers.create(dto));
    return {
      success: true,
      message: 'Customer created successfully',
      data: customer,
    };
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<ServiceResponse<Customer[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.customers
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.sites', 'site')
      .orderBy('customer.companyName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.search) {
      builder.andWhere(
        new Brackets((qb) =>
          qb
            .where('customer.companyName ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('customer.vatNumber ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('customer.email ILIKE :search', {
              search: `%${query.search}%`,
            }),
        ),
      );
    }
    const [data, total] = await builder.getManyAndCount();
    return {
      success: true,
      message: 'Customers retrieved successfully',
      data,
      meta: { page, limit, total },
    };
  }

  async findOne(id: string): Promise<ServiceResponse<Customer>> {
    const customer = await this.customers.findOne({
      where: { id },
      relations: { sites: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return {
      success: true,
      message: 'Customer retrieved successfully',
      data: customer,
    };
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<ServiceResponse<Customer>> {
    const customer = await this.requireCustomer(id);
    if (
      dto.vatNumber &&
      dto.vatNumber !== customer.vatNumber &&
      (await this.customers.exist({ where: { vatNumber: dto.vatNumber } }))
    ) {
      throw new ConflictException(
        'A customer with this VAT number already exists',
      );
    }
    this.customers.merge(customer, dto);
    return {
      success: true,
      message: 'Customer updated successfully',
      data: await this.customers.save(customer),
    };
  }

  async remove(id: string): Promise<ServiceResponse<void>> {
    const customer = await this.requireCustomer(id);
    await this.customers.remove(customer);
    return { success: true, message: 'Customer deleted successfully' };
  }

  async createSite(
    dto: CreateCustomerSiteDto,
  ): Promise<ServiceResponse<CustomerSite>> {
    await this.requireCustomer(dto.customerId);
    if (
      await this.sites.exist({
        where: { customerId: dto.customerId, name: dto.name },
      })
    ) {
      throw new ConflictException(
        'A site with this name already exists for the customer',
      );
    }
    const site = await this.sites.manager.transaction(async (manager) => {
      if (dto.isPrimary)
        await manager.update(
          CustomerSite,
          { customerId: dto.customerId },
          { isPrimary: false },
        );
      return manager.save(CustomerSite, manager.create(CustomerSite, dto));
    });
    return {
      success: true,
      message: 'Customer site created successfully',
      data: site,
    };
  }

  async updateSite(
    id: string,
    dto: UpdateCustomerSiteDto,
  ): Promise<ServiceResponse<CustomerSite>> {
    const site = await this.sites.findOneBy({ id });
    if (!site) throw new NotFoundException('Customer site not found');
    const customerId = dto.customerId ?? site.customerId;
    await this.requireCustomer(customerId);
    const data = await this.sites.manager.transaction(async (manager) => {
      if (dto.isPrimary)
        await manager.update(
          CustomerSite,
          { customerId },
          { isPrimary: false },
        );
      manager.merge(CustomerSite, site, dto);
      return manager.save(CustomerSite, site);
    });
    return {
      success: true,
      message: 'Customer site updated successfully',
      data,
    };
  }

  async removeSite(id: string): Promise<ServiceResponse<void>> {
    const result = await this.sites.delete(id);
    if (!result.affected)
      throw new NotFoundException('Customer site not found');
    return { success: true, message: 'Customer site deleted successfully' };
  }

  private async requireCustomer(id: string): Promise<Customer> {
    const customer = await this.customers.findOneBy({ id });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }
}
