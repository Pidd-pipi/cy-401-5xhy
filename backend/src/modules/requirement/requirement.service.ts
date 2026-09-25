import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { RequirementStatus } from '../../common/enums/requirement-status.enum';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { Requirement } from './entity/requirement.entity';

interface RequirementFilters {
  keyword?: string;
  status?: RequirementStatus;
  skill?: string;
  minBudget?: number;
  maxBudget?: number;
}

@Injectable()
export class RequirementService {
  constructor(
    @InjectRepository(Requirement)
    private readonly requirementRepository: Repository<Requirement>
  ) {}

  async findAll(filters: RequirementFilters) {
    const where: FindOptionsWhere<Requirement> = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.keyword) {
      where.title = Like(`%${filters.keyword}%`);
    }

    const qb = this.requirementRepository
      .createQueryBuilder('requirement')
      .leftJoinAndSelect('requirement.publisher', 'publisher')
      .where(where)
      .orderBy('requirement.createdAt', 'DESC');

    if (filters.skill) {
      qb.andWhere('requirement.skillTags LIKE :skill', { skill: `%${filters.skill}%` });
    }
    if (filters.minBudget !== undefined) {
      qb.andWhere('requirement.budgetMax >= :minBudget', { minBudget: filters.minBudget });
    }
    if (filters.maxBudget !== undefined) {
      qb.andWhere('requirement.budgetMin <= :maxBudget', { maxBudget: filters.maxBudget });
    }

    return qb.getMany();
  }

  async findMine(userId: string) {
    return this.requirementRepository.find({
      where: [{ publisherId: userId }, { winnerId: userId }],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: ['bids', 'bids.bidder', 'winner']
    });
    if (!requirement) {
      throw new NotFoundException('Requirement not found');
    }
    return requirement;
  }

  async create(publisherId: string, dto: CreateRequirementDto) {
    const requirement = this.requirementRepository.create({
      ...dto,
      publisherId,
      status: dto.status || RequirementStatus.Open
    });
    return this.requirementRepository.save(requirement);
  }

  async update(id: string, dto: UpdateRequirementDto) {
    const requirement = await this.findOne(id);
    Object.assign(requirement, dto);
    return this.requirementRepository.save(requirement);
  }

  async changeStatus(id: string, status: RequirementStatus) {
    const requirement = await this.findOne(id);
    requirement.status = status;
    return this.requirementRepository.save(requirement);
  }
}
