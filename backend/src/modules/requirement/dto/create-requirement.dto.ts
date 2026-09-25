import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import { RequirementStatus } from '../../../common/enums/requirement-status.enum';

export class CreateRequirementDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMin: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMax: number;

  @IsDateString()
  deadline: string;

  @IsArray()
  @IsOptional()
  skillTags?: string[];

  @IsEnum(RequirementStatus)
  @IsOptional()
  status?: RequirementStatus;
}
