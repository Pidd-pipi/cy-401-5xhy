import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { RequirementStatus } from '../../common/enums/requirement-status.enum';
import { ContractService } from '../contract/contract.service';
import { Requirement } from '../requirement/entity/requirement.entity';
import { Bid } from './entity/bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid) private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Requirement)
    private readonly requirementRepository: Repository<Requirement>,
    private readonly contractService: ContractService,
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
      throw new NotFoundException('Requirement not found');
    }
    if (
      [
        RequirementStatus.PendingContract,
        RequirementStatus.InProgress,
        RequirementStatus.Completed,
        RequirementStatus.Cancelled
      ].includes(requirement.status)
    ) {
      throw new BadRequestException('该需求已选定报价或已结束，无法继续报价');
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

  /**
   * 采纳报价：仅限需求发布者操作。采纳后中标报价置为已采纳、其他待选报价失效，
   * 需求进入待签合同状态，并按中标报价同步生成一份待签合同。
   * 合同双方签署完成后需求才会推进到进行中。
   */
  async accept(id: string, operatorId: string) {
    return this.dataSource.transaction(async manager => {
      const bid = await manager.findOne(Bid, { where: { id } });
      if (!bid) {
        throw new NotFoundException('Bid not found');
      }
      const requirement = await manager.findOne(Requirement, { where: { id: bid.requirementId } });
      if (!requirement) {
        throw new NotFoundException('Requirement not found');
      }
      if (requirement.publisherId !== operatorId) {
        throw new ForbiddenException('只有需求发布者可以采纳报价');
      }
      if (bid.status !== BidStatus.Pending) {
        throw new BadRequestException('该报价已处理，无法重复采纳');
      }
      if (
        [
          RequirementStatus.PendingContract,
          RequirementStatus.InProgress,
          RequirementStatus.Completed,
          RequirementStatus.Cancelled
        ].includes(requirement.status)
      ) {
        throw new BadRequestException('该需求已选定报价，无法重复采纳');
      }

      bid.status = BidStatus.Accepted;
      await manager.save(bid);

      await manager.update(
        Bid,
        { requirementId: requirement.id, status: BidStatus.Pending },
        { status: BidStatus.Rejected }
      );

      requirement.status = RequirementStatus.PendingContract;
      requirement.winnerId = bid.bidderId;
      await manager.save(requirement);

      await this.contractService.createFromAcceptedBid(manager, {
        requirement,
        acceptedBid: bid
      });

      return manager.findOne(Bid, { where: { id } });
    });
  }

  async reject(id: string, operatorId: string) {
    const bid = await this.findOne(id);
    const requirement = await this.requirementRepository.findOne({ where: { id: bid.requirementId } });
    if (!requirement) {
      throw new NotFoundException('Requirement not found');
    }
    if (requirement.publisherId !== operatorId) {
      throw new ForbiddenException('只有需求发布者可以拒绝报价');
    }
    if (bid.status !== BidStatus.Pending) {
      throw new BadRequestException('该报价已处理，无法重复操作');
    }
    bid.status = BidStatus.Rejected;
    return this.bidRepository.save(bid);
  }

  async withdraw(id: string, bidderId: string) {
    const bid = await this.findOne(id);
    if (bid.bidderId !== bidderId) {
      throw new BadRequestException('Only the bidder can withdraw this bid');
    }
    if (bid.status !== BidStatus.Pending) {
      throw new BadRequestException('该报价已处理，无法撤回');
    }
    bid.status = BidStatus.Withdrawn;
    return this.bidRepository.save(bid);
  }

  async findOne(id: string) {
    const bid = await this.bidRepository.findOne({ where: { id } });
    if (!bid) {
      throw new NotFoundException('Bid not found');
    }
    return bid;
  }
}
