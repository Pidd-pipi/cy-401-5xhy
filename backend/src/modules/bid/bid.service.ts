import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { ContractStatus } from '../../common/enums/contract-status.enum';
import { PaymentMode } from '../../common/enums/payment-mode.enum';
import { RequirementStatus } from '../../common/enums/requirement-status.enum';
import { Contract } from '../contract/entity/contract.entity';
import { Requirement } from '../requirement/entity/requirement.entity';
import { Bid } from './entity/bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid) private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Requirement)
    private readonly requirementRepository: Repository<Requirement>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    private readonly dataSource: DataSource
  ) {}

  async findAll() {
    return this.bidRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findMine(userId: string) {
    return this.bidRepository.find({
      where: { bidderId: userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findByRequirement(requirementId: string) {
    return this.bidRepository.find({
      where: { requirementId },
      order: { amount: 'ASC' }
    });
  }

  async submit(bidderId: string, dto: CreateBidDto) {
    const requirement = await this.requirementRepository.findOne({ where: { id: dto.requirementId } });
    if (!requirement) {
      throw new NotFoundException('需求不存在');
    }
    if ([RequirementStatus.Completed, RequirementStatus.Cancelled].includes(requirement.status)) {
      throw new BadRequestException('该需求已关闭，无法提交报价');
    }
    if (
      [RequirementStatus.PendingSign, RequirementStatus.InProgress].includes(requirement.status) ||
      requirement.winnerId
    ) {
      throw new BadRequestException('该需求已有中标报价，无法再提交报价');
    }

    requirement.status = RequirementStatus.Bidding;
    await this.requirementRepository.save(requirement);

    const bid = this.bidRepository.create({
      ...dto,
      bidderId,
      status: BidStatus.Pending
    });
    return this.bidRepository.save(bid);
  }

  async accept(id: string, operatorId: string) {
    const bid = await this.findOne(id);
    const requirement = await this.requirementRepository.findOne({
      where: { id: bid.requirementId }
    });
    if (!requirement) {
      throw new NotFoundException('需求不存在');
    }

    // 操作人限于需求发布者
    if (requirement.publisherId !== operatorId) {
      throw new ForbiddenException('只有需求发布者可以采纳报价');
    }

    // 已采纳过（可能是重复点击）：返回中标报价，不重复生成合同
    if (bid.status === BidStatus.Accepted) {
      return this.findOne(id);
    }
    if (bid.status !== BidStatus.Pending) {
      throw new BadRequestException('该报价已失效，无法采纳');
    }
    if (requirement.winnerId || requirement.status === RequirementStatus.InProgress) {
      throw new BadRequestException('该需求已采纳过其他报价');
    }

    // 金额按中标报价，完成时间按工期安排
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(bid.durationDays));
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    await this.dataSource.transaction(async manager => {
      bid.status = BidStatus.Accepted;
      await manager.save(bid);

      // 其他待选报价同步失效
      await manager.update(
        Bid,
        { requirementId: bid.requirementId, status: BidStatus.Pending },
        { status: BidStatus.Rejected }
      );

      const contract = manager.create(Contract, {
        contractNo: `CY-${Date.now()}`,
        requirementId: bid.requirementId,
        buyerId: requirement.publisherId,
        freelancerId: bid.bidderId,
        totalAmount: bid.amount,
        paymentMode: PaymentMode.OneTime,
        stages: [
          {
            title: '项目交付',
            amount: Number(bid.amount),
            dueDate: dueDateStr,
            completed: false
          }
        ],
        status: ContractStatus.PendingSign,
        buyerSignedAt: null,
        freelancerSignedAt: null
      });
      await manager.save(contract);

      // 合同双方签署生效后才进入进行中
      await manager.update(Requirement, requirement.id, {
        status: RequirementStatus.PendingSign,
        winnerId: bid.bidderId
      });
    });

    return this.findOne(id);
  }

  async reject(id: string, operatorId: string) {
    const bid = await this.findOne(id);
    const requirement = await this.requirementRepository.findOne({
      where: { id: bid.requirementId }
    });
    if (!requirement) {
      throw new NotFoundException('需求不存在');
    }
    if (requirement.publisherId !== operatorId) {
      throw new ForbiddenException('只有需求发布者可以拒绝报价');
    }
    if (bid.status !== BidStatus.Pending) {
      throw new BadRequestException('该报价已失效，无法拒绝');
    }
    bid.status = BidStatus.Rejected;
    return this.bidRepository.save(bid);
  }

  async withdraw(id: string, bidderId: string) {
    const bid = await this.findOne(id);
    if (bid.bidderId !== bidderId) {
      throw new BadRequestException('只有报价人可以撤回该报价');
    }
    if (bid.status !== BidStatus.Pending) {
      throw new BadRequestException('该报价已失效，无法撤回');
    }
    bid.status = BidStatus.Withdrawn;
    return this.bidRepository.save(bid);
  }

  async findOne(id: string) {
    const bid = await this.bidRepository.findOne({ where: { id } });
    if (!bid) {
      throw new NotFoundException('报价不存在');
    }
    return bid;
  }
}
