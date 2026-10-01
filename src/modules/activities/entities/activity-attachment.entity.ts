import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AttachmentType } from '../../../common/enums/platform.enums';
import { Activity } from './activity.entity';
import { User } from '../../users/entities/user.entity';

@Entity('activity_attachments')
@Index(['activityId', 'createdAt'])
export class ActivityAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ManyToOne(() => Activity, (activity) => activity.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({
    type: 'enum',
    enum: AttachmentType,
    enumName: 'attachment_type_enum',
  })
  type: AttachmentType;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'storage_key', length: 500, unique: true })
  storageKey: string;

  @Column({ name: 'mime_type', length: 120 })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes: string;

  @Column({ name: 'uploaded_by_id', type: 'uuid' })
  uploadedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
