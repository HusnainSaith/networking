import { ConflictException, NotFoundException } from '@nestjs/common';
import { ActivityStatus } from '../../common/enums/platform.enums';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  const feedbackRepository = {
    exist: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'feedback-id', ...value })),
  };
  const activityRepository = { findOneBy: jest.fn() };
  let service: FeedbackService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FeedbackService(
      feedbackRepository as never,
      activityRepository as never,
    );
  });

  it('rejects feedback for an unknown activity', async () => {
    activityRepository.findOneBy.mockResolvedValue(null);
    await expect(
      service.create({ activityId: 'missing', rating: 5 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects feedback before activity completion', async () => {
    activityRepository.findOneBy.mockResolvedValue({
      id: 'activity-id',
      customerId: 'customer-id',
      status: ActivityStatus.IN_PROGRESS,
    });
    await expect(
      service.create({ activityId: 'activity-id', rating: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects duplicate feedback', async () => {
    activityRepository.findOneBy.mockResolvedValue({
      id: 'activity-id',
      customerId: 'customer-id',
      status: ActivityStatus.COMPLETED,
    });
    feedbackRepository.exist.mockResolvedValue(true);
    await expect(
      service.create({ activityId: 'activity-id', rating: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('persists feedback against the activity customer', async () => {
    activityRepository.findOneBy.mockResolvedValue({
      id: 'activity-id',
      customerId: 'customer-id',
      status: ActivityStatus.COMPLETED,
    });
    feedbackRepository.exist.mockResolvedValue(false);

    const result = await service.create({
      activityId: 'activity-id',
      rating: 5,
      comments: 'Excellent service',
    });

    expect(result.data).toMatchObject({
      activityId: 'activity-id',
      customerId: 'customer-id',
      rating: 5,
    });
  });
});
