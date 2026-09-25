import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Bid } from '../../bid/entity/bid.entity';
import { Contract } from '../../contract/entity/contract.entity';
import { Requirement } from '../../requirement/entity/requirement.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 80 })
  username: string;

  @Column({ unique: true, length: 160 })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Dual })
  role: UserRole;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'simple-array', nullable: true })
  skillTags?: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact?: string;

  @OneToMany(() => Requirement, requirement => requirement.publisher)
  postedRequirements: Requirement[];

  @OneToMany(() => Requirement, requirement => requirement.winner)
  wonRequirements: Requirement[];

  @OneToMany(() => Bid, bid => bid.bidder)
  bids: Bid[];

  @OneToMany(() => Contract, contract => contract.buyer)
  buyerContracts: Contract[];

  @OneToMany(() => Contract, contract => contract.freelancer)
  freelancerContracts: Contract[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
