import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBidDto {
  @IsString()
  requirementId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationDays: number;

  @IsString()
  proposal: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}
