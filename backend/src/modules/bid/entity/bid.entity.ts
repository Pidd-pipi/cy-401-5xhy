import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { BidStatus } from '../../../common/enums/bid-status.enum';
import { Requirement } from '../../requirement/entity/requirement.entity';
import { User } from '../../user/entity/user.entity';

@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  durationDays: number;

  @Column({ type: 'text' })
  proposal: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments?: string[];

  @Column({ type: 'enum', enum: BidStatus, default: BidStatus.Pending })
  status: BidStatus;

  @Column()
  requirementId: string;

  @ManyToOne(() => Requirement, requirement => requirement.bids, { eager: true })
  @JoinColumn({ name: 'requirementId' })
  requirement: Requirement;

  @Column()
  bidderId: string;

  @ManyToOne(() => User, user => user.bids, { eager: true })
  @JoinColumn({ name: 'bidderId' })
  bidder: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
