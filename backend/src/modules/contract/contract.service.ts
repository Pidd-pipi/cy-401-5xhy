import { Injectable, NotFoundException } from '@nestjs/common';
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
      contractNo: `CY-${Date.now()}`,
      buyerId,
      stages: dto.stages.map(stage => ({ ...stage, completed: false })),
      status: ContractStatus.PendingSign
    });
    return this.contractRepository.save(contract);
  }

  async sign(id: string) {
    const contract = await this.findOne(id);
    contract.status = ContractStatus.Active;
    await this.requirementRepository.update(contract.requirementId, {
      status: RequirementStatus.InProgress,
      winnerId: contract.freelancerId
    });
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
}
