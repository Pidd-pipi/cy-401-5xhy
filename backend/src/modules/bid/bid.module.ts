import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement } from '../requirement/entity/requirement.entity';
import { BidController } from './bid.controller';
import { BidService } from './bid.service';
import { Bid } from './entity/bid.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bid, Requirement])],
  controllers: [BidController],
  providers: [BidService],
  exports: [BidService, TypeOrmModule]
})
export class BidModule {}
