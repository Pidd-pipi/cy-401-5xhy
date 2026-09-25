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

export class UpdateRequirementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetMin?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetMax?: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsArray()
  @IsOptional()
  skillTags?: string[];

  @IsEnum(RequirementStatus)
  @IsOptional()
  status?: RequirementStatus;
}
