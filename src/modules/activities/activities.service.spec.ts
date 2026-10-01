import { BadRequestException, ConflictException } from '@nestjs/common';
import { ActivityStatus } from '../../common/enums/platform.enums';
import { ActivitiesService } from './activities.service';

describe('ActivitiesService', () => {
  const activityRepository = {
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };
  const manager = {
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn((_entity, value) => value),
  };
  const dataSource = {
    transaction: jest.fn(async (callback) => callback(manager)),
  };
  let service: ActivitiesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ActivitiesService(
      dataSource as never,
      activityRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('rejects an invalid activity state transition', async () => {
    activityRepository.findOneBy.mockResolvedValue({
      id: 'activity-id',
      status: ActivityStatus.COMPLETED,
    });

    await expect(
      service.changeStatus(
        'activity-id',
        { status: ActivityStatus.IN_PROGRESS },
        'user-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('records valid status changes and start time transactionally', async () => {
    activityRepository.findOneBy.mockResolvedValue({
      id: 'activity-id',
      status: ActivityStatus.SCHEDULED,
      actualStart: null,
    });
    jest.spyOn(service, 'findOne').mockResolvedValue({
      success: true,
      message: 'Activity retrieved successfully',
      data: { id: 'activity-id' } as never,
    });

    await service.changeStatus(
      'activity-id',
      { status: ActivityStatus.IN_PROGRESS },
      'user-id',
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.update).toHaveBeenCalledWith(
      expect.any(Function),
      'activity-id',
      expect.objectContaining({
        status: ActivityStatus.IN_PROGRESS,
        actualStart: expect.any(Date),
      }),
    );
    expect(manager.save).toHaveBeenCalled();
  });

  it('prevents deleting an activity already in progress', async () => {
    activityRepository.findOneBy.mockResolvedValue({
      id: 'activity-id',
      status: ActivityStatus.IN_PROGRESS,
    });

    await expect(service.remove('activity-id')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(activityRepository.remove).not.toHaveBeenCalled();
  });

  it('allows an unassigned activity to be deleted', async () => {
    const activity = {
      id: 'activity-id',
      status: ActivityStatus.UNASSIGNED,
    };
    activityRepository.findOneBy.mockResolvedValue(activity);

    await expect(service.remove('activity-id')).resolves.toMatchObject({
      success: true,
    });
    expect(activityRepository.remove).toHaveBeenCalledWith(activity);
  });
});
