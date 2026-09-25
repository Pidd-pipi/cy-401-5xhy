import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractStatus } from '../../common/enums/contract-status.enum';
import { RequirementStatus } from '../../common/enums/requirement-status.enum';
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
      throw new NotFoundException('合同不存在');
    }
    return contract;
  }

  async create(buyerId: string, dto: CreateContractDto) {
    const requirement = await this.requirementRepository.findOne({ where: { id: dto.requirementId } });
    if (!requirement) {
      throw new NotFoundException('需求不存在');
    }

    const contract = this.contractRepository.create({
      ...dto,
      contractNo: `CY-${Date.now()}`,
      buyerId,
      stages: dto.stages.map(stage => ({ ...stage, completed: false })),
      status: ContractStatus.PendingSign,
      buyerSignedAt: null,
      freelancerSignedAt: null
    });
    return this.contractRepository.save(contract);
  }

  /**
   * 合同双方分别确认：
   * - 只有甲方（需求发布者）或乙方（中标自由职业者）可以签署
   * - 先签一方看到等待状态，另一方确认后合同才生效并推进需求
   * - 同一方重复点击保留首次签署时间
   */
  async sign(id: string, userId: string) {
    const contract = await this.findOne(id);

    const role = this.getPartyRole(contract, userId);
    if (!role) {
      throw new ForbiddenException('只有合同双方可以签署该合同');
    }
    if (contract.status !== ContractStatus.PendingSign) {
      throw new BadRequestException('当前合同状态不可签署');
    }

    // 同一方重复签署：直接返回，保留首次签署时间
    const alreadySigned =
      role === 'buyer' ? contract.buyerSignedAt : contract.freelancerSignedAt;
    if (alreadySigned) {
      return contract;
    }

    const signedAt = new Date();
    if (role === 'buyer') {
      contract.buyerSignedAt = signedAt;
    } else {
      contract.freelancerSignedAt = signedAt;
    }

    // 另一方也已签署，合同生效并推进需求
    if (contract.buyerSignedAt && contract.freelancerSignedAt) {
      contract.status = ContractStatus.Active;
      await this.requirementRepository.update(contract.requirementId, {
        status: RequirementStatus.InProgress,
        winnerId: contract.freelancerId
      });
    }

    return this.contractRepository.save(contract);
  }

  async complete(id: string, userId?: string) {
    const contract = await this.findOne(id);
    if (userId && !this.getPartyRole(contract, userId)) {
      throw new ForbiddenException('只有合同双方可以操作该合同');
    }
    if (contract.status !== ContractStatus.Active) {
      throw new BadRequestException('只有执行中的合同可以完成确认');
    }
    contract.status = ContractStatus.Completed;
    contract.stages = contract.stages.map(stage => ({ ...stage, completed: true }));
    await this.requirementRepository.update(contract.requirementId, {
      status: RequirementStatus.Completed
    });
    return this.contractRepository.save(contract);
  }

  async terminate(id: string, userId?: string) {
    const contract = await this.findOne(id);
    if (userId && !this.getPartyRole(contract, userId)) {
      throw new ForbiddenException('只有合同双方可以操作该合同');
    }
    if ([ContractStatus.Completed, ContractStatus.Terminated].includes(contract.status)) {
      throw new BadRequestException('当前合同状态不可终止');
    }
    contract.status = ContractStatus.Terminated;
    return this.contractRepository.save(contract);
  }

  private getPartyRole(
    contract: Contract,
    userId: string
  ): 'buyer' | 'freelancer' | null {
    if (contract.buyerId === userId) {
      return 'buyer';
    }
    if (contract.freelancerId === userId) {
      return 'freelancer';
    }
    return null;
  }
}
