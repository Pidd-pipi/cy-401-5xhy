import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement } from '../requirement/entity/requirement.entity';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { Contract } from './entity/contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contract, Requirement])],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService, TypeOrmModule]
})
export class ContractModule {}
