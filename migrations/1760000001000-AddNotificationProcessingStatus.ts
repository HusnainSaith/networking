import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationProcessingStatus1760000001000 implements MigrationInterface {
  name = 'AddNotificationProcessingStatus1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "notification_status_enum" ADD VALUE IF NOT EXISTS 'processing' AFTER 'pending'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot safely remove an enum value in place. The value is
    // intentionally retained when reverting this additive migration.
  }
}
