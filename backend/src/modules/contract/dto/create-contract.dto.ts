import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';

export class ContractStageDto {
  @IsString()
  title: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  dueDate: string;
}

export class CreateContractDto {
  @IsString()
  requirementId: string;

  @IsString()
  freelancerId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractStageDto)
  stages: ContractStageDto[];
}
