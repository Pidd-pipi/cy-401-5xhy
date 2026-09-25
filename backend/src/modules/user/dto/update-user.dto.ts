import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsArray()
  @IsOptional()
  skillTags?: string[];

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  contact?: string;
}
