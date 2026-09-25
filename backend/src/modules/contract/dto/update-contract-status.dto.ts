import { IsEnum } from 'class-validator';
import { ContractStatus } from '../../../common/enums/contract-status.enum';

export class UpdateContractStatusDto {
  @IsEnum(ContractStatus)
  status: ContractStatus;
}
