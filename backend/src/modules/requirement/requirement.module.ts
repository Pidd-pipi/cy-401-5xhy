import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement } from './entity/requirement.entity';
import { RequirementController } from './requirement.controller';
import { RequirementService } from './requirement.service';

@Module({
  imports: [TypeOrmModule.forFeature([Requirement])],
  controllers: [RequirementController],
  providers: [RequirementService],
  exports: [RequirementService, TypeOrmModule]
})
export class RequirementModule {}
