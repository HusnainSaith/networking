import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('customer_signatures')
@Index(['activityId', 'signedAt'])
export class CustomerSignature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ManyToOne(() => Activity, (activity) => activity.signatures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ name: 'signer_name', length: 120 })
  signerName: string;

  @Column({ name: 'signer_role', length: 100, nullable: true })
  signerRole?: string;

  @Column({ name: 'signature_storage_key', length: 500 })
  signatureStorageKey: string;

  @Column({ name: 'signed_at', type: 'timestamptz' })
  signedAt: Date;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
