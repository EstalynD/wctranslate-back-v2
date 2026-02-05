import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// ==================== LEVEL REWARD DTO ====================

export class LevelRewardDto {
  @IsNumber()
  @Min(0)
  tokens: number;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unlocks?: string[];
}

// ==================== LEVEL CONFIG DTOs ====================

export class CreateLevelConfigDto {
  @IsNumber()
  @Min(1)
  level: number;

  @IsNumber()
  @Min(0)
  xpRequired: number;

  @IsNumber()
  @Min(1)
  xpToNextLevel: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  badgeUrl?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LevelRewardDto)
  rewards?: LevelRewardDto;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  tokenMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  xpMultiplier?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLevelConfigDto extends PartialType(CreateLevelConfigDto) {}

// ==================== RESPONSE DTOs ====================

export class LevelConfigResponseDto {
  id: string;
  level: number;
  xpRequired: number;
  xpToNextLevel: number;
  name: string;
  description: string | null;
  badgeUrl: string | null;
  color: string | null;
  rewards: LevelRewardDto;
  tokenMultiplier: number;
  xpMultiplier: number;
  isActive: boolean;
}

export class AllLevelsResponseDto {
  levels: LevelConfigResponseDto[];
  maxLevel: number;
  totalLevels: number;
}
