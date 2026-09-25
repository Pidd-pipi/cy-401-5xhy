import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ContractStatus } from '../../common/enums/contract-status.enum';
import { PaymentMode } from '../../common/enums/payment-mode.enum';
import { RequirementStatus } from '../../common/enums/requirement-status.enum';
import { Bid } from '../bid/entity/bid.entity';
import { Requirement } from '../requirement/entity/requirement.entity';
import { Contract } from './entity/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Requirement)
    private readonly requirementRepository: Repository<Requirement>
  ) {}

  async findAll() {
    return this.contractRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findMine(userId: string) {
    return this.contractRepository.find({
      where: [{ buyerId: userId }, { freelancerId: userId }],
      order: { createdAt: 'DESC' }
    });
  }

  async findByRequirement(requirementId: string) {
    return this.contractRepository.find({
      where: { requirementId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return contract;
  }

  async create(buyerId: string, dto: CreateContractDto) {
    const requirement = await this.requirementRepository.findOne({ where: { id: dto.requirementId } });
    if (!requirement) {
      throw new NotFoundException('Requirement not found');
    }

    const contract = this.contractRepository.create({
      ...dto,
      contractNo: this.generateContractNo(),
      buyerId,
      stages: dto.stages.map(stage => ({ ...stage, completed: false })),
      status: ContractStatus.PendingSign,
      buyerSignedAt: null,
      freelancerSignedAt: null
    });
    return this.contractRepository.save(contract);
  }

  /**
   * 采纳报价时生成待签合同：金额取中标报价，完成时间按报价工期顺延，
   * 采用一次性付款的单一阶段。与采纳流程共用事务，保证同时成功或同时回滚。
   */
  async createFromAcceptedBid(
    manager: EntityManager,
    params: { requirement: Requirement; acceptedBid: Bid }
  ): Promise<Contract> {
    const { requirement, acceptedBid } = params;
    const dueDate = this.calculateDueDate(new Date(), acceptedBid.durationDays);

    const contract = manager.create(Contract, {
      contractNo: this.generateContractNo(),
      requirementId: requirement.id,
      buyerId: requirement.publisherId,
      freelancerId: acceptedBid.bidderId,
      totalAmount: acceptedBid.amount,
      paymentMode: PaymentMode.OneTime,
      stages: [
        {
          title: requirement.title,
          amount: Number(acceptedBid.amount),
          dueDate,
          completed: false
        }
      ],
      status: ContractStatus.PendingSign,
      buyerSignedAt: null,
      freelancerSignedAt: null
    });
    return manager.save(contract);
  }

  /**
   * 合同双方分别确认：先签一方仅记录签署时间并保持待签状态；
   * 双方都签后合同生效并把需求推进到进行中。同一方重复点击幂等，
   * 保留首次签署时间。仅合同当事人可签署。
   */
  async sign(id: string, userId: string) {
    const contract = await this.findOne(id);

    if (contract.buyerId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException('只有合同双方可以签署该合同');
    }
    if (contract.status !== ContractStatus.PendingSign) {
      throw new BadRequestException('当前合同状态不允许签署');
    }

    const now = new Date();
    if (contract.buyerId === userId && !contract.buyerSignedAt) {
      contract.buyerSignedAt = now;
    }
    if (contract.freelancerId === userId && !contract.freelancerSignedAt) {
      contract.freelancerSignedAt = now;
    }

    if (contract.buyerSignedAt && contract.freelancerSignedAt) {
      contract.status = ContractStatus.Active;
      await this.requirementRepository.update(contract.requirementId, {
        status: RequirementStatus.InProgress,
        winnerId: contract.freelancerId
      });
    }

    return this.contractRepository.save(contract);
  }

  async complete(id: string) {
    const contract = await this.findOne(id);
    contract.status = ContractStatus.Completed;
    contract.stages = contract.stages.map(stage => ({ ...stage, completed: true }));
    await this.requirementRepository.update(contract.requirementId, {
      status: RequirementStatus.Completed
    });
    return this.contractRepository.save(contract);
  }

  async terminate(id: string) {
    const contract = await this.findOne(id);
    contract.status = ContractStatus.Terminated;
    return this.contractRepository.save(contract);
  }

  private generateContractNo(): string {
    return `CY-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  private calculateDueDate(start: Date, durationDays: number): string {
    const due = new Date(start);
    due.setDate(due.getDate() + Number(durationDays));
    return due.toISOString().slice(0, 10);
  }
}
