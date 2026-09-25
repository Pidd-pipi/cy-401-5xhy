import { IsEnum } from 'class-validator';
import { BidStatus } from '../../../common/enums/bid-status.enum';

export class UpdateBidStatusDto {
  @IsEnum(BidStatus)
  status: BidStatus;
}
