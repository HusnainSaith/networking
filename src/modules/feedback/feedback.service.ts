import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityStatus } from '../../common/enums/platform.enums';
import { Activity } from '../activities/entities/activity.entity';
import { CreateCustomerFeedbackDto } from './dto/create-customer-feedback.dto';
import { CustomerFeedback } from './entities/customer-feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(CustomerFeedback)
    private readonly feedback: Repository<CustomerFeedback>,
    @InjectRepository(Activity)
    private readonly activities: Repository<Activity>,
  ) {}

  async create(dto: CreateCustomerFeedbackDto) {
    const activity = await this.activities.findOneBy({ id: dto.activityId });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.status !== ActivityStatus.COMPLETED)
      throw new ConflictException(
        'Feedback can only be submitted for completed activities',
      );
    if (await this.feedback.exist({ where: { activityId: dto.activityId } }))
      throw new ConflictException(
        'Feedback has already been submitted for this activity',
      );
    const data = await this.feedback.save(
      this.feedback.create({ ...dto, customerId: activity.customerId }),
    );
    return {
      success: true,
      message: 'Customer feedback submitted successfully',
      data,
    };
  }

  async findByCustomer(customerId: string) {
    const data = await this.feedback.find({
      where: { customerId },
      relations: { activity: true },
      order: { createdAt: 'DESC' },
    });
    return {
      success: true,
      message: 'Customer feedback retrieved successfully',
      data,
    };
  }
}
