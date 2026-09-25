import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BidStatus } from '../../common/enums/bid-status.enum';
import { RequirementStatus } from '../../common/enums/requirement-status.enum';
import { Requirement } from '../requirement/entity/requirement.entity';
import { Bid } from './entity/bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid) private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Requirement)
    private readonly requirementRepository: Repository<Requirement>
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
    if ([RequirementStatus.Completed, RequirementStatus.Cancelled].includes(requirement.status)) {
      throw new BadRequestException('Requirement is closed for bidding');
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

  async accept(id: string) {
    const bid = await this.findOne(id);
    bid.status = BidStatus.Accepted;
    await this.bidRepository.save(bid);

    await this.bidRepository.update(
      { requirementId: bid.requirementId, status: BidStatus.Pending },
      { status: BidStatus.Rejected }
    );
    await this.requirementRepository.update(bid.requirementId, {
      status: RequirementStatus.InProgress,
      winnerId: bid.bidderId
    });
    return this.findOne(id);
  }

  async reject(id: string) {
    const bid = await this.findOne(id);
    bid.status = BidStatus.Rejected;
    return this.bidRepository.save(bid);
  }

  async withdraw(id: string, bidderId: string) {
    const bid = await this.findOne(id);
    if (bid.bidderId !== bidderId) {
      throw new BadRequestException('Only the bidder can withdraw this bid');
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
