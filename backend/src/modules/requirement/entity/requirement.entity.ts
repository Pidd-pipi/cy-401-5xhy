import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { RequirementStatus } from '../../../common/enums/requirement-status.enum';
import { Bid } from '../../bid/entity/bid.entity';
import { Contract } from '../../contract/entity/contract.entity';
import { User } from '../../user/entity/user.entity';

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  budgetMin: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  budgetMax: number;

  @Column({ type: 'date' })
  deadline: string;

  @Column({ type: 'simple-array', nullable: true })
  skillTags?: string[];

  @Column({ type: 'enum', enum: RequirementStatus, default: RequirementStatus.Open })
  status: RequirementStatus;

  @Column()
  publisherId: string;

  @ManyToOne(() => User, user => user.postedRequirements, { eager: true })
  @JoinColumn({ name: 'publisherId' })
  publisher: User;

  @Column({ nullable: true })
  winnerId?: string | null;

  @ManyToOne(() => User, user => user.wonRequirements, { nullable: true })
  @JoinColumn({ name: 'winnerId' })
  winner?: User | null;

  @OneToMany(() => Bid, bid => bid.requirement)
  bids: Bid[];

  @OneToMany(() => Contract, contract => contract.requirement)
  contracts: Contract[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
