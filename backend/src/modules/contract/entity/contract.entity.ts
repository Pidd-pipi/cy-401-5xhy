import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { ContractStatus } from '../../../common/enums/contract-status.enum';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';
import { Requirement } from '../../requirement/entity/requirement.entity';
import { User } from '../../user/entity/user.entity';

export interface ContractStage {
  title: string;
  amount: number;
  dueDate: string;
  completed: boolean;
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 40 })
  contractNo: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: PaymentMode, default: PaymentMode.Milestone })
  paymentMode: PaymentMode;

  @Column({ type: 'json' })
  stages: ContractStage[];

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.PendingSign })
  status: ContractStatus;

  @Column()
  requirementId: string;

  @ManyToOne(() => Requirement, requirement => requirement.contracts, { eager: true })
  @JoinColumn({ name: 'requirementId' })
  requirement: Requirement;

  @Column()
  buyerId: string;

  @ManyToOne(() => User, user => user.buyerContracts, { eager: true })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column()
  freelancerId: string;

  @ManyToOne(() => User, user => user.freelancerContracts, { eager: true })
  @JoinColumn({ name: 'freelancerId' })
  freelancer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
