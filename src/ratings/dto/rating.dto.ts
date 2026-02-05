import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsMongoId,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// --- Create Rating DTO ---
export class CreateLessonRatingDto {
  @IsMongoId()
  lessonId: string;

  @IsMongoId()
  courseId: string;

  @IsOptional()
  @IsMongoId()
  themeId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  understandingStars: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  usefulnessStars: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficultyStars?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  engagementStars?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  improvementText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

// --- Update Rating DTO ---
export class UpdateLessonRatingDto extends PartialType(CreateLessonRatingDto) {}

// --- Admin Review DTO ---
export class AdminReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminResponse?: string;

  @IsBoolean()
  isReviewed: boolean;
}

// --- Rating Response DTO ---
export class LessonRatingResponseDto {
  id: string;
  lessonId: string;
  userId: string;
  courseId: string;
  themeId?: string;
  understandingStars: number;
  usefulnessStars: number;
  difficultyStars?: number;
  engagementStars?: number;
  averageStars: number;
  improvementText?: string;
  comment?: string;
  tags?: string[];
  isAnonymous: boolean;
  isReviewed: boolean;
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Rating Stats DTO ---
export class LessonRatingStatsDto {
  lessonId: string;
  totalRatings: number;
  averageUnderstanding: number;
  averageUsefulness: number;
  averageDifficulty?: number;
  averageEngagement?: number;
  overallAverage: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  commonTags: { tag: string; count: number }[];
}

// --- Query DTO ---
export class RatingQueryDto {
  @IsOptional()
  @IsMongoId()
  lessonId?: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsMongoId()
  themeId?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  isReviewed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  minStars?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  maxStars?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'averageStars';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  skip?: number;
}
